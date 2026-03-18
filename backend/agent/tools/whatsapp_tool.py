"""Tool para enviar mensajes de WhatsApp y abrir apps via Android"""

import os
import httpx
from langchain.tools import tool

# IP del celular - configura en .env
ANDROID_WEBHOOK_URL = os.getenv("ANDROID_WEBHOOK_URL", "http://10.0.147.207:5000/action")


def _send_to_phone(payload: dict) -> dict:
    """Helper para enviar comandos al celular."""
    try:
        r = httpx.post(ANDROID_WEBHOOK_URL, json=payload, timeout=5.0)
        if r.status_code == 200:
            return {"success": True, "data": r.json()}
        return {"success": False, "error": f"HTTP {r.status_code}"}
    except httpx.ConnectError:
        return {
            "success": False,
            "error": (
                f"Celular no disponible en {ANDROID_WEBHOOK_URL}. "
                "Asegúrate de que la app GENOMA esté abierta y en la misma red."
            )
        }
    except httpx.TimeoutException:
        return {"success": False, "error": "El celular no respondió (timeout 5s)."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@tool
def send_whatsapp_tool(contact: str, message: str) -> str:
    """Envía un mensaje de WhatsApp a un contacto desde el celular del usuario.
    Args:
        contact: Nombre o número del contacto (ej: 'Juan', '3001234567')
        message: Texto del mensaje a enviar
    """
    result = _send_to_phone({
        "action": "send_whatsapp",
        "params": {"contact": contact, "message": message}
    })
    if result["success"]:
        data = result.get("data", {})
        if data.get("success"):
            return f"✅ WhatsApp abierto para {contact} con el mensaje: '{message}'"
        return f"⚠️ WhatsApp no se pudo abrir: {data.get('message', 'error desconocido')}"
    return f"⚠️ {result['error']}"


@tool
def open_app_tool(app_name: str) -> str:
    """Abre una aplicación instalada en el celular Android del usuario.
    Apps soportadas: WhatsApp, YouTube, Spotify, Chrome, Camera, Maps, Instagram, TikTok, Settings, Calculator, Calendar.
    Args:
        app_name: Nombre de la app a abrir (ej: 'WhatsApp', 'Spotify')
    """
    app_packages = {
        "whatsapp": "com.whatsapp",
        "youtube": "com.google.android.youtube",
        "spotify": "com.spotify.music",
        "chrome": "com.android.chrome",
        "camera": "com.android.camera2",
        "maps": "com.google.android.apps.maps",
        "instagram": "com.instagram.android",
        "tiktok": "com.zhiliaoapp.musically",
        "settings": "com.android.settings",
        "calculator": "com.android.calculator2",
        "calendar": "com.google.android.calendar",
    }
    package = app_packages.get(app_name.lower(), app_name)
    result = _send_to_phone({
        "action": "open_app",
        "params": {"package": package, "name": app_name}
    })
    if result["success"]:
        return f"✅ Abriendo {app_name} en tu celular..."
    return f"⚠️ {result['error']}"
