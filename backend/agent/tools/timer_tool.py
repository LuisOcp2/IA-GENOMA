"""Tool para alarmas y temporizadores en Android"""

import os
import httpx
from langchain.tools import tool

ANDROID_WEBHOOK_URL = os.getenv("ANDROID_WEBHOOK_URL", "http://localhost:5000/action")


@tool
def set_alarm_tool(time: str, label: str = "Alarma GENOMA") -> str:
    """Programa una alarma en el celular Android.
    Args:
        time: Hora en formato HH:MM (24h) ej: '07:30'
        label: Etiqueta de la alarma
    """
    try:
        payload = {
            "action": "set_alarm",
            "params": {"time": time, "label": label}
        }
        r = httpx.post(ANDROID_WEBHOOK_URL, json=payload, timeout=5.0)
        if r.status_code == 200:
            return f"⏰ Alarma programada para las {time} - '{label}'"
        return f"⚠️ Error programando alarma"
    except httpx.ConnectError:
        return "⚠️ App GENOMA no disponible. Ábrela primero."
    except Exception as e:
        return f"Error: {str(e)}"


@tool
def set_timer_tool(minutes: int, label: str = "Temporizador") -> str:
    """Inicia un temporizador en el celular.
    Args:
        minutes: Minutos del temporizador
        label: Etiqueta descriptiva
    """
    try:
        payload = {
            "action": "set_timer",
            "params": {"minutes": minutes, "label": label}
        }
        r = httpx.post(ANDROID_WEBHOOK_URL, json=payload, timeout=5.0)
        if r.status_code == 200:
            return f"⏱️ Temporizador de {minutes} minutos iniciado - '{label}'"
        return "⚠️ Error iniciando temporizador"
    except httpx.ConnectError:
        return "⚠️ App GENOMA no disponible. Ábrela primero."
    except Exception as e:
        return f"Error: {str(e)}"
