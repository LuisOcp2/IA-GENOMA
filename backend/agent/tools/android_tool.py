"""Tool para enviar acciones al celular Android via webhook"""

import os
import httpx
from langchain.tools import tool

# La app Android expone un servidor local que recibe comandos
ANDROID_WEBHOOK_URL = os.getenv("ANDROID_WEBHOOK_URL", "http://localhost:5000/action")


@tool
def send_android_action_tool(action: str, params: str = "") -> str:
    """Envía una acción al celular Android del usuario para ejecutar en el sistema.
    Acciones disponibles: open_app, send_message, set_alarm, call_contact, play_music, show_notification.
    Args:
        action: El tipo de acción a ejecutar
        params: Parámetros de la acción en formato 'clave:valor,clave:valor'
    """
    try:
        payload = {
            "action": action,
            "params": {}
        }

        # Parsear params 'app:WhatsApp,contact:Cristian'
        if params:
            for pair in params.split(","):
                if ":" in pair:
                    k, v = pair.split(":", 1)
                    payload["params"][k.strip()] = v.strip()

        # Enviar al servidor local de la app Android
        response = httpx.post(
            ANDROID_WEBHOOK_URL,
            json=payload,
            timeout=5.0
        )

        if response.status_code == 200:
            return f"✅ Acción '{action}' enviada al celular exitosamente."
        else:
            return f"⚠️ El celular respondió con error: {response.status_code}"

    except httpx.ConnectError:
        return f"⚠️ No se pudo conectar al celular. Asegúrate de que la app GENOMA esté abierta."
    except Exception as e:
        return f"Error enviando acción al celular: {str(e)}"
