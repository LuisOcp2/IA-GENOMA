/**
 * IA-GENOMA - Servidor HTTP Local en Android
 *
 * Este servidor corre DENTRO del celular en el puerto 5000.
 * El backend Python se conecta a él para enviar comandos (abrir apps,
 * alarmas, WhatsApp, etc.) al celular.
 *
 * Implementado con react-native-tcp-socket + servidor HTTP manual.
 *
 * Instalación: npm install react-native-tcp-socket
 */

import {NativeModules, Linking, ToastAndroid} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

const PORT = 5000;
let server = null;

/**
 * Manejador de acciones recibidas del backend
 */
async function handleAction(action, params) {
  console.log(`[LOCAL SERVER] Acción recibida: ${action}`, params);

  switch (action) {
    case 'open_app': {
      const pkg = params.package || params.name;
      try {
        await Linking.openURL(`intent:#Intent;package=${pkg};end`);
        return {success: true, message: `App ${params.name} abierta`};
      } catch (e) {
        // Intentar con URL scheme
        await Linking.openURL(`market://details?id=${pkg}`);
        return {success: false, message: `No se pudo abrir ${params.name}`};
      }
    }

    case 'send_whatsapp': {
      const {contact, message} = params;
      // Si es número, enviar directo; si es nombre, abrir WhatsApp con el mensaje
      const phone = contact.replace(/[^0-9]/g, '');
      const url = phone
        ? `whatsapp://send?phone=57${phone}&text=${encodeURIComponent(message)}`
        : `whatsapp://send?text=${encodeURIComponent(`Para ${contact}: ${message}`)}`;
      try {
        await Linking.openURL(url);
        return {success: true, message: `WhatsApp abierto para ${contact}`};
      } catch (e) {
        return {success: false, message: 'WhatsApp no instalado'};
      }
    }

    case 'set_alarm': {
      const [hours, minutes] = (params.time || '07:00').split(':').map(Number);
      try {
        await Linking.openURL(
          `intent:#Intent;action=android.intent.action.SET_ALARM;` +
          `i.android.intent.extra.alarm.HOUR=${hours};` +
          `i.android.intent.extra.alarm.MINUTES=${minutes};` +
          `S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(params.label || 'GENOMA')};` +
          `end`
        );
        return {success: true, message: `Alarma ${params.time} programada`};
      } catch (e) {
        return {success: false, message: 'Error programando alarma'};
      }
    }

    case 'set_timer': {
      const seconds = (params.minutes || 1) * 60;
      try {
        await Linking.openURL(
          `intent:#Intent;action=android.intent.action.SET_TIMER;` +
          `i.android.intent.extra.timer.LENGTH=${seconds};` +
          `S.android.intent.extra.timer.MESSAGE=${encodeURIComponent(params.label || 'GENOMA')};` +
          `end`
        );
        return {success: true, message: `Timer de ${params.minutes} min iniciado`};
      } catch (e) {
        return {success: false, message: 'Error iniciando timer'};
      }
    }

    case 'show_notification': {
      ToastAndroid.showWithGravity(
        params.message || 'GENOMA',
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
      );
      return {success: true};
    }

    case 'call_contact': {
      const phone = params.phone || params.contact;
      try {
        await Linking.openURL(`tel:${phone}`);
        return {success: true, message: `Llamando a ${params.contact}`};
      } catch (e) {
        return {success: false, message: 'Error iniciando llamada'};
      }
    }

    case 'open_url': {
      try {
        await Linking.openURL(params.url);
        return {success: true};
      } catch (e) {
        return {success: false, message: 'No se pudo abrir la URL'};
      }
    }

    default:
      return {success: false, message: `Acción desconocida: ${action}`};
  }
}

/**
 * Parser HTTP mínimo para leer body JSON del request
 */
function parseHttpRequest(data) {
  const str = data.toString();
  const headerEnd = str.indexOf('\r\n\r\n');
  if (headerEnd === -1) return null;
  const body = str.slice(headerEnd + 4);
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Inicia el servidor HTTP local en el puerto 5000
 */
export function startLocalServer(onAction) {
  if (server) {
    console.log('[LOCAL SERVER] Ya está corriendo');
    return;
  }

  server = TcpSocket.createServer(socket => {
    socket.on('data', async data => {
      const parsed = parseHttpRequest(data);
      if (!parsed) {
        socket.write('HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n');
        return;
      }

      const {action, params = {}} = parsed;
      const result = await handleAction(action, params);

      // Notificar a la UI
      if (onAction) onAction(action, params, result);

      const body = JSON.stringify(result);
      socket.write(
        `HTTP/1.1 200 OK\r\n` +
        `Content-Type: application/json\r\n` +
        `Content-Length: ${body.length}\r\n` +
        `\r\n` +
        body
      );
    });

    socket.on('error', err => console.warn('[LOCAL SERVER] Socket error:', err));
  });

  server.listen({port: PORT, host: '0.0.0.0'}, () => {
    console.log(`[LOCAL SERVER] ✅ Escuchando en puerto ${PORT}`);
  });

  server.on('error', err => console.error('[LOCAL SERVER] Error:', err));
}

export function stopLocalServer() {
  if (server) {
    server.close();
    server = null;
    console.log('[LOCAL SERVER] Detenido');
  }
}
