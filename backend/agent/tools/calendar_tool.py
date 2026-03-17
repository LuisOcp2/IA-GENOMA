"""Tool para consultar Google Calendar"""

import os
from datetime import datetime, timedelta
from langchain.tools import tool


@tool
def get_calendar_events_tool(days_ahead: int = 1) -> str:
    """Obtiene los eventos del calendario de Google para los próximos días.
    Args:
        days_ahead: Cuántos días hacia adelante consultar (default 1 = hoy)
    """
    try:
        # Intentar usar Google Calendar API
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        import pickle

        SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
        creds = None
        token_file = os.getenv("GOOGLE_CALENDAR_TOKEN_FILE", "token.json")
        creds_file = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_FILE", "credentials.json")

        if os.path.exists(token_file):
            creds = Credentials.from_authorized_user_file(token_file, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(creds_file):
                    return "⚠️ Google Calendar no configurado. Sube el archivo credentials.json del proyecto de Google Cloud."
                flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
                creds = flow.run_local_server(port=0)
            with open(token_file, "w") as token:
                token.write(creds.to_json())

        service = build("calendar", "v3", credentials=creds)

        now = datetime.utcnow().isoformat() + "Z"
        end = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + "Z"

        events_result = service.events().list(
            calendarId="primary",
            timeMin=now,
            timeMax=end,
            maxResults=10,
            singleEvents=True,
            orderBy="startTime"
        ).execute()

        events = events_result.get("items", [])

        if not events:
            return f"No tienes eventos en los próximos {days_ahead} día(s)."

        result = []
        for event in events:
            start = event["start"].get("dateTime", event["start"].get("date"))
            result.append(f"📅 {event['summary']} - {start}")

        return "\n".join(result)

    except ImportError:
        return "⚠️ Librería de Google Calendar no instalada."
    except Exception as e:
        return f"Error consultando calendario: {str(e)}"
