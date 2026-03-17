# 📱 Configuración Android - GENOMA

## 1. Instalar dependencia del servidor local

La app Android actúa como servidor HTTP en el puerto 5000
para recibir comandos del backend Python.

```bash
cd mobile
npm install react-native-tcp-socket
npx react-native run-android
```

## 2. Configurar IP del backend en la app

Edita `mobile/src/config/api.js`:

```js
// Misma red WiFi:
export const BACKEND_URL = 'http://192.168.X.X:8000';

// Cloudflare Tunnel:
export const BACKEND_URL = 'https://random.trycloudflare.com';
```

## 3. Configurar IP del celular en el backend

El backend necesita saber la IP local de tu celular Android
para enviarle comandos. Edita `.env`:

```env
# IP local de tu celular Android (ver en Ajustes > WiFi > detalles)
ANDROID_WEBHOOK_URL=http://192.168.X.XCELULAR:5000/action
```

## 4. Permisos necesarios en el celular

La app pedirá automáticamente:
- ✅ Micrófono
- ✅ Contactos
- ✅ Notificaciones

Para control avanzado del sistema (leer pantalla, hacer clics):
1. Ve a Ajustes > Accesibilidad
2. Busca "GENOMA"
3. Activa el servicio

## 5. Registrar como asistente predeterminado

Para activar con botón de inicio largo (como Google Assistant):
1. Ajustes > Apps > App de asistencia predeterminada
2. Selecciona GENOMA

## 6. Iniciar todo

**Terminal 1 - Backend:**
```bash
cd backend && source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Scheduler de recordatorios:**
```bash
cd backend && source venv/bin/activate
python scheduler.py
```

**Terminal 3 - App React Native:**
```bash
cd mobile && npx react-native run-android
```
