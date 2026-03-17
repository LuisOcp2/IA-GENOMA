"""TTS Service - Text-to-Speech usando Edge-TTS (Microsoft, totalmente gratuito)"""

import os
import edge_tts
from dotenv import load_dotenv

load_dotenv()


async def synthesize_speech(text: str, output_path: str) -> str:
    """
    Convierte texto a audio MP3 usando Edge-TTS (voces de Microsoft, gratis).
    Voz colombiana por defecto: es-CO-SalomeNeural (mujer) o es-CO-GonzaloNeural (hombre)
    """
    voice = os.getenv("TTS_VOICE", "es-CO-SalomeNeural")

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        return output_path
    except Exception as e:
        print(f"[TTS ERROR] {e}")
        # Fallback: crear archivo vacío para no romper el flujo
        open(output_path, "w").close()
        return output_path


async def list_voices(language: str = "es") -> list:
    """Lista las voces disponibles en español"""
    voices = await edge_tts.list_voices()
    return [v for v in voices if v["Locale"].startswith(language)]
