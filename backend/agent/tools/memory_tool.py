"""Tool de memoria persistente del agente - recuerda info del usuario"""

import os
from datetime import datetime
from langchain.tools import tool
from tinydb import TinyDB, Query

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "memory.json")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
db = TinyDB(DB_PATH)
Memory = db.table("memory")


@tool
def remember_tool(key: str, value: str) -> str:
    """Guarda un dato importante sobre el usuario para recordarlo en el futuro.
    Úsalo cuando el usuario te diga algo sobre sí mismo, sus preferencias, rutinas, etc.
    Args:
        key: Identificador del dato (ej: 'nombre', 'trabajo', 'horario_gimnasio')
        value: El valor a recordar
    """
    try:
        M = Query()
        existing = Memory.search(M.key == key)
        entry = {
            "key": key,
            "value": value,
            "updated_at": datetime.now().isoformat()
        }
        if existing:
            Memory.update(entry, M.key == key)
            return f"✅ Actualicé en mi memoria: {key} = {value}"
        else:
            Memory.insert(entry)
            return f"✅ Guardé en mi memoria: {key} = {value}"
    except Exception as e:
        return f"Error guardando memoria: {str(e)}"


@tool
def recall_tool(key: str = "") -> str:
    """Consulta datos guardados en la memoria sobre el usuario.
    Args:
        key: Clave específica a buscar. Si está vacío, retorna todo lo recordado.
    """
    try:
        if key:
            M = Query()
            results = Memory.search(M.key.search(key, flags=2))
        else:
            results = Memory.all()

        if not results:
            return "No tengo nada guardado en memoria sobre eso."

        lines = [f"🧠 {r['key']}: {r['value']}" for r in results]
        return "\n".join(lines)
    except Exception as e:
        return f"Error consultando memoria: {str(e)}"
