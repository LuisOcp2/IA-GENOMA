"""Tool para enviar mensajes de WhatsApp via Android"""

import os
import httpx
from langchain.tools import tool

ANDROID_WEBHOOK_URL = os.getenv("ANDROID_WEBHOOK_URL", "http://localhost:5000/action")


@tool
def send_whatsapp_tool(contact: str, message: str) -> str:
    """Envía un mensaje de WhatsApp a un contacto.
    Args:
        contact: Nombre o número del contacto
        message: Mensaje a enviar
    """
    try:
        payload = {
            "action": "send_whatsapp",
            "params": {"contact": contact, "message": message}
        }
        r = httpx.post(ANDROID_WEBHOOK_URL, json=payload, timeout=5.0)
        if r.status_code == 200:
            return f"✅ WhatsApp enviado a {contact}: '{message}'"
        return f"⚠️ Error enviando WhatsApp: {r.status_code}"
    except httpx.ConnectError:
        return "⚠️ App GENOMA no disponible en el celular. Ábrela primero."
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def open_app_tool(app_name: str) -> str:
    """Abre una aplicación en el celular Android.
    Apps disponibles: WhatsApp, YouTube, Spotify, Chrome, Camera, Maps, Instagram, TikTok, Settings.
    Args:
        app_name: Nombre de la app a abrir
    """
    try:
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
        payload = {"action": "open_app", "params": {"package": package, "name": app_name}}
        r = httpx.post(ANDROID_WEBHOOK_URL, json=payload, timeout=5.0)
        if r.status_code == 200:
            return f"✅ Abriendo {app_name} en tu celular..."
        return f"⚠️ No se pudo abrir {app_name}"
    except httpx.ConnectError:
        return "⚠️ App GENOMA no disponible. Ábrela primero."
    except Exception as e:
        return f"Error: {str(e)}"
