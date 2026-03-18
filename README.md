# 🧬 IA-GENOMA - Tu Agente de IA Personal

> Agente de voz personal, 100% tuyo, que corre en Android con escucha por wake word, backend Python con FastAPI + LangChain, y motor de IA con Groq (Llama 3).

---

## 🏗️ Arquitectura

```
[Android App - React Native]
        ↓ Wake Word (Porcupine)
        ↓ Graba audio
        ↓ Envía al Backend
[Backend - FastAPI + Python]
        ↓ STT (Whisper via Groq)
        ↓ LangChain Agent razona
        ↓ Ejecuta Tools (Calendario, Recordatorios, Búsqueda...)
        ↓ TTS (Edge-TTS o ElevenLabs)
[Android App] ← Reproduce audio de respuesta
```

---

## 📁 Estructura del Proyecto

```
IA-GENOMA/
├── backend/          # FastAPI + LangChain Agent
│   ├── main.py
│   ├── agent/
│   │   ├── agent_core.py
│   │   └── tools/
│   ├── stt/
│   ├── tts/
│   └── requirements.txt
└── IAGenoma/         # React Native App Android
    ├── android/
    ├── ios/
    ├── src/
    │   ├── services/
    │   └── screens/
    └── package.json
```

---

## 🚀 Setup Rápido

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edita .env con tus API keys
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Exponer con Cloudflare Tunnel (para que tu celular lo alcance)
```bash
cloudflared tunnel --url http://localhost:8000
```

### 3. Mobile
```bash
cd IAGenoma
npm install
npx react-native run-android
```

---

## 🔑 APIs Utilizadas

| Servicio | Uso | Gratuito |
|----------|-----|----------|
| **Groq** | LLM (Llama 3.3 70B) + Whisper STT | ✅ |
| **Google AI (Gemini)** | LLM alternativo | ✅ |
| **OpenRouter** | Fallback multi-modelo | ✅ |
| **SambaNova** | LLM ultra-rápido | ✅ |
| **Edge-TTS** | Text-to-Speech (Microsoft) | ✅ Gratis |
| **Picovoice Porcupine** | Wake Word detection | ✅ Personal |

---

## 🧠 Capacidades del Agente

- 🎙️ Escucha continua con wake word personalizado
- 📅 Acceso a Google Calendar
- ⏰ Creación de recordatorios
- 🔍 Búsqueda web en tiempo real
- 📱 Control de apps Android (Accessibility Service)
- 💬 Respuesta por voz natural
- 🧠 Memoria de conversación
- 📝 Notas y tareas

---

## ⚠️ Permisos Android Requeridos

- `RECORD_AUDIO` - Micrófono
- `FOREGROUND_SERVICE` - Servicio en segundo plano
- `BIND_ACCESSIBILITY_SERVICE` - Control del sistema
- `SET_WALLPAPER`, `READ_CONTACTS`, etc.

---

## 👤 Autor
Luis Ocampo - IA-GENOMA Project

---

## React Native Development Setup

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

### Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

### Step 2: Start your Application

Let Metro Bundler run in its _own terminal. Open a _new terminal_ from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

#### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

#### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

### Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `src/App.js` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
