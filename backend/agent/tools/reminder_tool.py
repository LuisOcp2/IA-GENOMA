"""Tools para gestión de recordatorios con TinyDB"""

import os
from datetime import datetime
from langchain.tools import tool
from tinydb import TinyDB, Query

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "reminders.json")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
db = TinyDB(DB_PATH)
Reminders = db.table("reminders")


@tool
def create_reminder_tool(title: str, datetime_str: str, description: str = "") -> str:
    """Crea un recordatorio. 
    Args:
        title: Título del recordatorio
        datetime_str: Fecha y hora en formato 'YYYY-MM-DD HH:MM' o descripción como 'mañana a las 3pm'
        description: Descripción opcional
    """
    try:
        reminder = {
            "title": title,
            "datetime": datetime_str,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "done": False
        }
        Reminders.insert(reminder)
        return f"✅ Recordatorio creado: '{title}' para {datetime_str}"
    except Exception as e:
        return f"Error creando recordatorio: {str(e)}"


@tool
def list_reminders_tool(only_pending: bool = True) -> str:
    """Lista los recordatorios guardados.
    Args:
        only_pending: Si True, solo muestra los pendientes (no completados)
    """
    try:
        R = Query()
        if only_pending:
            items = Reminders.search(R.done == False)
        else:
            items = Reminders.all()

        if not items:
            return "No tienes recordatorios pendientes."

        result = []
        for item in items:
            status = "⏳" if not item.get("done") else "✅"
            result.append(f"{status} {item['title']} - {item['datetime']}")

        return "\n".join(result)
    except Exception as e:
        return f"Error listando recordatorios: {str(e)}"
