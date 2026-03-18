"""TTS Service - Text-to-Speech con gTTS (Google, gratuito) + fallback edge-tts"""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

TTS_ENGINE = os.getenv("TTS_ENGINE", "gtts")  # "gtts" o "edge"


async def synthesize_speech(text: str, output_path: str) -> str:
    """
    Convierte texto a MP3.
    - Motor por defecto: gTTS (Google, gratis, sin restricciones)
    - Fallback: edge-tts si gTTS falla
    """
    if TTS_ENGINE == "edge":
        return await _synthesize_edge(text, output_path)
    else:
        return await _synthesize_gtts(text, output_path)


async def _synthesize_gtts(text: str, output_path: str) -> str:
    """gTTS - Google Text-to-Speech, gratuito sin API key"""
    try:
        from gtts import gTTS
        # Correr en thread para no bloquear el event loop
        def _generate():
            tts = gTTS(text=text, lang="es", slow=False)
            tts.save(output_path)
        await asyncio.get_event_loop().run_in_executor(None, _generate)
        print(f"[TTS] gTTS OK -> {output_path}")
        return output_path
    except Exception as e:
        print(f"[TTS gTTS ERROR] {e} - intentando edge-tts...")
        return await _synthesize_edge(text, output_path)


async def _synthesize_edge(text: str, output_path: str) -> str:
    """edge-tts - Microsoft (puede dar 403 ocasionalmente)"""
    try:
        import edge_tts
        voice = os.getenv("TTS_VOICE", "es-CO-SalomeNeural")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        print(f"[TTS] edge-tts OK -> {output_path}")
        return output_path
    except Exception as e:
        print(f"[TTS edge ERROR] {e}")
        open(output_path, "wb").close()
        return output_path


async def list_voices(language: str = "es") -> list:
    """Lista voces disponibles (solo con edge-tts)"""
    try:
        import edge_tts
        voices = await edge_tts.list_voices()
        return [v for v in voices if v["Locale"].startswith(language)]
    except Exception:
        return []
