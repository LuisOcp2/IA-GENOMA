# AndroidLocalServer — Guía de Configuración

## ¿Qué es?

El `AndroidLocalServer` es un servidor HTTP que corre **dentro del celular** en el puerto 5000.
El backend Python (PC) le envía comandos para ejecutar acciones nativas: abrir WhatsApp,
programar alarmas, abrir apps, etc.

## Flujo completo

```
[Voz usuario] → [App RN] → [FastAPI PC :8000] → [Agente LangChain]
                                                        ↓
                                            [tool: send_whatsapp_tool]
                                                        ↓
                                        POST http://<IP_CELULAR>:5000/action
                                                        ↓
                                         [AndroidLocalServer en el celular]
                                                        ↓
                                          [Linking.openURL → WhatsApp]
```

## Configuración paso a paso

### 1. Encontrar la IP del celular

En el celular: **Ajustes → WiFi → tu red actual → detalles → Dirección IP**

Ejemplo: `10.0.147.89`

### 2. Configurar backend/.env

```bash
ANDROID_WEBHOOK_URL=http://10.0.147.89:5000/action
```

> Si usas Tailscale, usa la IP 100.x.x.x del celular en vez de la IP local.

### 3. Abrir puerto en el celular (Android)

No se necesita configuración adicional. `react-native-tcp-socket` abre el puerto
automáticamente cuando se inicia la app.

### 4. Verificar que funciona

Desde la PC (con la app GENOMA abierta en el celular):

```bash
curl -X POST http://10.0.147.89:5000/action \
  -H 'Content-Type: application/json' \
  -d '{"action": "ping"}'
# Respuesta esperada: {"success": true, "message": "pong - GENOMA local server activo ✅"}
```

### 5. Probar WhatsApp

```bash
curl -X POST http://10.0.147.89:5000/action \
  -H 'Content-Type: application/json' \
  -d '{"action": "send_whatsapp", "params": {"contact": "Test", "message": "Hola desde GENOMA"}}'
```

### 6. Probar alarma

```bash
curl -X POST http://10.0.147.89:5000/action \
  -H 'Content-Type: application/json' \
  -d '{"action": "set_alarm", "params": {"time": "08:00", "label": "Prueba GENOMA"}}'
```

## Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `ConnectError` desde PC | IP incorrecta o app cerrada | Verificar IP en .env, abrir app |
| `EADDRINUSE` en app | Puerto 5000 ocupado | Reiniciar app |
| WhatsApp no abre | WhatsApp no instalado | Verificar instalación |
| Alarma no se crea | Permisos denegados | Ajustes → Permisos → GENOMA |

## Rate Limit Groq

Si ves error 429 (rate limit diario 100k tokens):

```bash
# En backend/.env, cambiar temporalmente:
LLM_MODEL=llama-3.1-8b-instant
```
