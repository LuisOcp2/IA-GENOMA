/**
 * IA-GENOMA - Servidor HTTP Local en Android (Puerto 5000)
 *
 * Corre DENTRO del celular. El backend Python (en la PC) se conecta
 * aquí para ejecutar acciones: WhatsApp, alarmas, abrir apps, etc.
 *
 * Dependencia: react-native-tcp-socket (ya en package.json)
 * Si no instalaste: npm install react-native-tcp-socket && npx react-native run-android
 */

import {Linking, ToastAndroid, Platform} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

const PORT = 5000;
let server = null;
let isRunning = false;

// ─── Manejador de acciones ───────────────────────────────────────────────────
async function handleAction(action, params) {
  console.log(`[LOCAL SERVER] 📨 Acción: ${action}`, params);

  switch (action) {

    case 'open_app': {
      const pkg = params.package || params.name;
      const url = `intent:#Intent;package=${pkg};end`;
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return {success: true, message: `App ${params.name || pkg} abierta`};
        }
        return {success: false, message: `No se puede abrir ${params.name || pkg} - ¿está instalada?`};
      } catch (e) {
        return {success: false, message: `Error abriendo app: ${e.message}`};
      }
    }

    case 'send_whatsapp': {
      const {contact, message} = params;
      // Si es solo dígitos, asumir número; sino buscar por nombre
      const isPhone = /^\d+$/.test(contact.replace(/[\s\-+]/g, ''));
      const phone = isPhone ? contact.replace(/[^0-9]/g, '') : null;
      // Número colombiano: agregar 57 si no lo tiene
      const fullPhone = phone && !phone.startsWith('57') ? `57${phone}` : phone;
      const url = fullPhone
        ? `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(message)}`
        : `whatsapp://send?text=${encodeURIComponent(`Para ${contact}: ${message}`)}`;
      try {
        const canOpen = await Linking.canOpenURL('whatsapp://send');
        if (!canOpen) {
          return {success: false, message: 'WhatsApp no está instalado'};
        }
        await Linking.openURL(url);
        return {success: true, message: `WhatsApp abierto para ${contact}`};
      } catch (e) {
        return {success: false, message: `Error: ${e.message}`};
      }
    }

    case 'set_alarm': {
      const [hours, minutes] = (params.time || '07:00').split(':').map(Number);
      const label = encodeURIComponent(params.label || 'GENOMA');
      const url =
        `intent:#Intent;` +
        `action=android.intent.action.SET_ALARM;` +
        `i.android.intent.extra.alarm.HOUR=${hours};` +
        `i.android.intent.extra.alarm.MINUTES=${minutes};` +
        `S.android.intent.extra.alarm.MESSAGE=${label};` +
        `b.android.intent.extra.alarm.SKIP_UI=true;` +
        `end`;
      try {
        await Linking.openURL(url);
        return {success: true, message: `Alarma ${params.time} (${params.label || 'GENOMA'}) programada`};
      } catch (e) {
        return {success: false, message: `Error al programar alarma: ${e.message}`};
      }
    }

    case 'set_timer': {
      const seconds = (parseInt(params.minutes, 10) || 1) * 60;
      const label = encodeURIComponent(params.label || 'GENOMA');
      const url =
        `intent:#Intent;` +
        `action=android.intent.action.SET_TIMER;` +
        `i.android.intent.extra.timer.LENGTH=${seconds};` +
        `S.android.intent.extra.timer.MESSAGE=${label};` +
        `b.android.intent.extra.timer.SKIP_UI=true;` +
        `end`;
      try {
        await Linking.openURL(url);
        return {success: true, message: `Timer de ${params.minutes} min iniciado`};
      } catch (e) {
        return {success: false, message: `Error al iniciar timer: ${e.message}`};
      }
    }

    case 'show_notification': {
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          params.message || '📲 GENOMA',
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
      }
      return {success: true, message: 'Notificación mostrada'};
    }

    case 'call_contact': {
      const phone = params.phone || params.contact;
      try {
        await Linking.openURL(`tel:${phone}`);
        return {success: true, message: `Llamando a ${params.contact || phone}`};
      } catch (e) {
        return {success: false, message: `Error iniciando llamada: ${e.message}`};
      }
    }

    case 'open_url': {
      try {
        await Linking.openURL(params.url);
        return {success: true, message: `URL abierta: ${params.url}`};
      } catch (e) {
        return {success: false, message: `No se pudo abrir la URL: ${e.message}`};
      }
    }

    case 'ping':
      return {success: true, message: 'pong - GENOMA local server activo ✅'};

    default:
      return {success: false, message: `Acción desconocida: ${action}`};
  }
}

// ─── Parser HTTP mínimo ───────────────────────────────────────────────────────
function parseHttpRequest(data) {
  const str = data.toString();
  const headerEnd = str.indexOf('\r\n\r\n');
  if (headerEnd === -1) return null;
  const body = str.slice(headerEnd + 4).trim();
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function buildHttpResponse(statusCode, body) {
  const statusText = statusCode === 200 ? 'OK' : 'Bad Request';
  const json = JSON.stringify(body);
  return (
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    `Content-Type: application/json\r\n` +
    `Content-Length: ${Buffer.byteLength(json)}\r\n` +
    `Access-Control-Allow-Origin: *\r\n` +
    `\r\n` +
    json
  );
}

// ─── Servidor TCP ─────────────────────────────────────────────────────────────
export function startLocalServer(onAction) {
  if (isRunning) {
    console.log('[LOCAL SERVER] Ya está corriendo en puerto', PORT);
    return;
  }

  try {
    server = TcpSocket.createServer(socket => {
      let buffer = '';

      socket.on('data', async data => {
        buffer += data.toString();

        // Esperar a tener cabeceras completas + body
        if (!buffer.includes('\r\n\r\n')) return;

        const parsed = parseHttpRequest(buffer);
        buffer = '';

        if (!parsed) {
          socket.write(buildHttpResponse(400, {success: false, message: 'JSON inválido'}));
          socket.destroy();
          return;
        }

        const {action, params = {}} = parsed;
        const result = await handleAction(action, params);

        // Notificar a la UI (HomeScreen)
        if (onAction) {
          onAction(action, params, result);
        }

        socket.write(buildHttpResponse(200, result));
        socket.destroy();
      });

      socket.on('error', err => {
        // Ignorar errores de conexión cerrada normales
        if (err.code !== 'ECONNRESET') {
          console.warn('[LOCAL SERVER] Socket error:', err.message);
        }
      });
    });

    server.listen({port: PORT, host: '0.0.0.0'}, () => {
      isRunning = true;
      console.log(`[LOCAL SERVER] ✅ Escuchando en 0.0.0.0:${PORT}`);
    });

    server.on('error', err => {
      console.error('[LOCAL SERVER] ❌ Error:', err.message);
      isRunning = false;
      // Reintentar en 5 segundos si falla
      setTimeout(() => startLocalServer(onAction), 5000);
    });

  } catch (e) {
    console.error('[LOCAL SERVER] ❌ No se pudo iniciar:', e.message);
    isRunning = false;
  }
}

export function stopLocalServer() {
  if (server) {
    server.close();
    server = null;
    isRunning = false;
    console.log('[LOCAL SERVER] 🛑 Detenido');
  }
}

export function isServerRunning() {
  return isRunning;
}
