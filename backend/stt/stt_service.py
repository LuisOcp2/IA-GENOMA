"""STT Service - Speech-to-Text usando Whisper via Groq (gratuito y rapidísimo)"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()


async def transcribe_audio(audio_file_path: str) -> str:
    """Transcribe un archivo de audio a texto usando Whisper vía Groq API"""
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("STT_MODEL", "whisper-large-v3")

    if not api_key:
        raise ValueError("GROQ_API_KEY no configurada")

    try:
        with open(audio_file_path, "rb") as audio_file:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files={
                        "file": (os.path.basename(audio_file_path), audio_file, "audio/wav")
                    },
                    data={
                        "model": model,
                        "language": "es",
                        "response_format": "json"
                    }
                )

                if response.status_code != 200:
                    print(f"[STT ERROR] Groq respondió: {response.status_code} - {response.text}")
                    return ""

                result = response.json()
                return result.get("text", "").strip()

    except Exception as e:
        print(f"[STT ERROR] {e}")
        return ""
