"""Tool para enviar acciones al celular Android via webhook"""

import os
import httpx
from langchain.tools import tool

# La app Android expone un servidor local que recibe comandos del backend
# IMPORTANTE: Debe ser la IP del celular en la red, NO localhost
# Configura ANDROID_WEBHOOK_URL en backend/.env
ANDROID_WEBHOOK_URL = os.getenv("ANDROID_WEBHOOK_URL", "http://10.0.147.207:5000/action")


def _send_to_phone(payload: dict) -> dict:
    """Envía un comando al servidor local del celular. Retorna dict con success y message."""
    try:
        r = httpx.post(ANDROID_WEBHOOK_URL, json=payload, timeout=5.0)
        if r.status_code == 200:
            return {"success": True, "data": r.json()}
        return {"success": False, "error": f"HTTP {r.status_code}"}
    except httpx.ConnectError:
        return {
            "success": False,
            "error": (
                f"No se pudo conectar al celular en {ANDROID_WEBHOOK_URL}. "
                "Verifica que: 1) La app GENOMA esté abierta, "
                "2) El celular y la PC estén en la misma red, "
                "3) ANDROID_WEBHOOK_URL en .env tenga la IP correcta del celular."
            )
        }
    except httpx.TimeoutException:
        return {"success": False, "error": "Timeout: el celular no respondió en 5 segundos."}
    except Exception as e:
        return {"success": False, "error": str(e)}


@tool
def send_android_action_tool(action: str, params: str = "") -> str:
    """Envía una acción al celular Android del usuario para ejecutar en el sistema.
    Acciones disponibles: open_app, send_whatsapp, set_alarm, set_timer, call_contact, show_notification.
    Args:
        action: El tipo de acción a ejecutar
        params: Parámetros en formato 'clave:valor,clave:valor'
    """
    payload = {"action": action, "params": {}}

    if params:
        for pair in params.split(","):
            if ":" in pair:
                k, v = pair.split(":", 1)
                payload["params"][k.strip()] = v.strip()

    result = _send_to_phone(payload)
    if result["success"]:
        return f"✅ Acción '{action}' ejecutada en el celular."
    return f"⚠️ {result['error']}"
