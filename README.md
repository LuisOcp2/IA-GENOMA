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
└── mobile/           # React Native App Android
    └── src/
        ├── services/
        └── screens/
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
cd mobile
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
