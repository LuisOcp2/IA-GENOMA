"""Tool para obtener fecha y hora actual"""

from langchain.tools import tool
from datetime import datetime
import pytz


@tool
def get_datetime_tool(timezone: str = "America/Bogota") -> str:
    """Obtiene la fecha y hora actual.
    Args:
        timezone: Zona horaria (default: America/Bogota para Colombia)
    """
    try:
        tz = pytz.timezone(timezone)
        now = datetime.now(tz)
        days_es = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
        months_es = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                     "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        day_name = days_es[now.weekday()]
        month_name = months_es[now.month - 1]
        return (
            f"Hoy es {day_name} {now.day} de {month_name} de {now.year}. "
            f"Son las {now.strftime('%I:%M %p')}."
        )
    except Exception as e:
        return f"Error obteniendo fecha: {str(e)}"
