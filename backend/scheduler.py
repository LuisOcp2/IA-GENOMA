"""IA-GENOMA - Scheduler de recordatorios

Corre en paralelo al servidor FastAPI.
Revisa cada minuto si hay recordatorios que disparar
y envía una notificación push al celular.

Uso: python scheduler.py (en otra terminal)
"""

import os
import asyncio
import httpx
from datetime import datetime
from tinydb import TinyDB, Query
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "reminders.json")
ANDROID_WEBHOOK = os.getenv("ANDROID_WEBHOOK_URL", "http://localhost:5000/action")
CHECK_INTERVAL = 60  # segundos


def get_pending_reminders():
    if not os.path.exists(DB_PATH):
        return []
    db = TinyDB(DB_PATH)
    R = Query()
    return db.table("reminders").search(R.done == False)


def mark_done(reminder_id):
    db = TinyDB(DB_PATH)
    db.table("reminders").update({"done": True}, doc_ids=[reminder_id])


async def notify_android(title: str, message: str):
    """Envía notificación al celular Android"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(ANDROID_WEBHOOK, json={
                "action": "show_notification",
                "params": {"title": title, "message": message}
            })
        print(f"[SCHEDULER] 📲 Notificación enviada: {title}")
    except Exception as e:
        print(f"[SCHEDULER] ⚠️ No se pudo notificar: {e}")


def should_fire(reminder) -> bool:
    """Verifica si un recordatorio debe dispararse ahora"""
    now = datetime.now()
    dt_str = reminder.get("datetime", "")
    if not dt_str:
        return False
    try:
        # Intentar parsear formato YYYY-MM-DD HH:MM
        dt = datetime.strptime(dt_str[:16], "%Y-%m-%d %H:%M")
        # Disparar si la hora ya pasó y estamos en el mismo minuto
        diff = (now - dt).total_seconds()
        return 0 <= diff < CHECK_INTERVAL
    except ValueError:
        return False


async def check_reminders():
    reminders = get_pending_reminders()
    for r in reminders:
        if should_fire(r):
            print(f"[SCHEDULER] ⏰ Disparando: {r['title']}")
            await notify_android(
                title=f"⏰ {r['title']}",
                message=r.get("description", "Recordatorio de GENOMA")
            )
            mark_done(r.doc_id)


async def main():
    print(f"[SCHEDULER] 🚀 Iniciado - revisando cada {CHECK_INTERVAL}s")
    while True:
        try:
            await check_reminders()
        except Exception as e:
            print(f"[SCHEDULER] Error: {e}")
        await asyncio.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
