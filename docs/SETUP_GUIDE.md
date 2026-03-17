# 🧬 IA-GENOMA - Guía de Setup Completo

## Paso 1: Configurar el Backend

### 1.1 Crear entorno virtual
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows
```

### 1.2 Instalar dependencias
```bash
pip install -r requirements.txt
```

### 1.3 Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env y llena:
# GROQ_API_KEY=tu_key_de_groq
# GOOGLE_AI_KEY=tu_key_de_google
# API_SECRET_TOKEN=un_token_secreto_que_tu_elijas
```

### 1.4 Iniciar el servidor
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Visita http://localhost:8000 para verificar que funciona.

---

## Paso 2: Exponer el Backend a tu Celular

### Opción A: Misma red WiFi (más fácil)
Encuentra la IP de tu computador:
```bash
ip addr show  # Linux
ipconfig      # Windows
```
En la app, pon `http://192.168.X.X:8000` como URL del backend.

### Opción B: Cloudflare Tunnel (desde cualquier red)
```bash
# Instalar cloudflared
brew install cloudflare/cloudflare/cloudflared  # Mac
# o descarga desde https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Crear túnel
cloudflared tunnel --url http://localhost:8000
# Te dará una URL como: https://random-words.trycloudflare.com
# Pon esa URL en la app
```

---

## Paso 3: Configurar Google Calendar (Opcional)

1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto
3. Habilita la API de Google Calendar
4. Crea credenciales OAuth 2.0 (tipo Desktop app)
5. Descarga el archivo `credentials.json`
6. Ponlo en la carpeta `backend/`
7. La primera vez que uses el calendario, se abrirá una ventana para autorizar

---

## Paso 4: App React Native Android

### 4.1 Requisitos
- Node.js 18+
- JDK 17
- Android Studio con SDK
- Un celular Android con modo desarrollador activado

### 4.2 Instalación
```bash
cd mobile
npm install
```

### 4.3 Configurar URL del backend
Edita `mobile/src/config/api.js`:
```js
export const BACKEND_URL = 'http://TU_IP_O_TUNEL:8000';
export const API_TOKEN = 'el_mismo_token_que_en_.env';
```

### 4.4 Ejecutar en Android
```bash
npx react-native run-android
```

---

## Paso 5: Wake Word con Porcupine (Opcional pero recomendado)

1. Crea cuenta gratuita en https://console.picovoice.ai/
2. Obtén tu Access Key
3. Entrena tu wake word personalizado (ej: "Genoma")
4. Descarga el modelo `.ppn`
5. Sigue las instrucciones en `mobile/src/services/WakeWordService.js`

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Backend no responde | Verifica que uvicorn está corriendo y el firewall permite el puerto 8000 |
| App no graba audio | Otorga permiso de micrófono en Ajustes > Apps > IAGenoma |
| STT no funciona | Verifica GROQ_API_KEY en el .env |
| Audio no se reproduce | Verifica que el volumen del celular esté alto |
| Error 401 | El API_TOKEN en la app debe coincidir con el del .env |
