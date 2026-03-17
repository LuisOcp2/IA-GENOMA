"""Tools para gestión de notas personales"""

import os
from datetime import datetime
from langchain.tools import tool
from tinydb import TinyDB, Query

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "notes.json")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
db = TinyDB(DB_PATH)
Notes = db.table("notes")


@tool
def create_note_tool(title: str, content: str, tags: str = "") -> str:
    """Crea una nota personal.
    Args:
        title: Título de la nota
        content: Contenido de la nota
        tags: Etiquetas separadas por comas (opcional)
    """
    try:
        note = {
            "title": title,
            "content": content,
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
            "created_at": datetime.now().isoformat()
        }
        Notes.insert(note)
        return f"📝 Nota guardada: '{title}'"
    except Exception as e:
        return f"Error guardando nota: {str(e)}"


@tool
def list_notes_tool(search: str = "") -> str:
    """Lista las notas guardadas, opcionalmente filtrando por texto.
    Args:
        search: Texto a buscar en título o contenido (vacío = todas)
    """
    try:
        if search:
            N = Query()
            items = Notes.search(
                N.title.search(search, flags=2) |
                N.content.search(search, flags=2)
            )
        else:
            items = Notes.all()[-10:]  # últimas 10

        if not items:
            return "No encontré notas."

        result = []
        for item in items:
            date = item["created_at"][:10]
            result.append(f"📄 [{date}] {item['title']}\n   {item['content'][:100]}...")

        return "\n\n".join(result)
    except Exception as e:
        return f"Error listando notas: {str(e)}"
