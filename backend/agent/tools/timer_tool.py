"""Tool para alarmas y timers via Android"""

import os
import re
import httpx
from langchain.tools import tool

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
def set_alarm_tool(time: str, label: str = "GENOMA") -> str:
    """Programa una alarma en el celular Android del usuario.
    Args:
        time: Hora en formato HH:MM, ej: '07:30', '22:00'
        label: Etiqueta de la alarma (opcional), ej: 'Reunión', 'Gimnasio'
    """
    # Validar formato HH:MM
    if not re.match(r'^\d{1,2}:\d{2}$', time):
        return f"⚠️ Formato de hora inválido: '{time}'. Usa HH:MM, ej: '07:30'"

    result = _send_to_phone({
        "action": "set_alarm",
        "params": {"time": time, "label": label}
    })
    if result["success"]:
        data = result.get("data", {})
        if data.get("success"):
            return f"✅ Alarma programada para las {time} ({label})"
        return f"⚠️ Error al programar alarma: {data.get('message', 'error desconocido')}"
    return f"⚠️ {result['error']}"


@tool
def set_timer_tool(minutes: int, label: str = "GENOMA") -> str:
    """Inicia un contador regresivo (timer) en el celular Android del usuario.
    Args:
        minutes: Duración del timer en minutos, ej: 5, 10, 30
        label: Etiqueta del timer (opcional)
    """
    if minutes <= 0 or minutes > 1440:
        return "⚠️ Los minutos deben estar entre 1 y 1440 (24 horas)."

    result = _send_to_phone({
        "action": "set_timer",
        "params": {"minutes": minutes, "label": label}
    })
    if result["success"]:
        data = result.get("data", {})
        if data.get("success"):
            return f"✅ Timer de {minutes} minuto(s) iniciado ({label})"
        return f"⚠️ Error al iniciar timer: {data.get('message', 'error desconocido')}"
    return f"⚠️ {result['error']}"
