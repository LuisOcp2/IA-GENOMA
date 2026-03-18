"""IA-GENOMA Backend - FastAPI Server Principal"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import tempfile
import uuid
from dotenv import load_dotenv

from agent.agent_core import GenomaAgent
from stt.stt_service import transcribe_audio
from tts.tts_service import synthesize_speech

load_dotenv()

app = FastAPI(
    title="IA-GENOMA API",
    description="Backend del Agente Personal GENOMA",
    version="1.0.0"
)

# CORS para React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instancia global del agente
agent = GenomaAgent()

API_SECRET = os.getenv("API_SECRET_TOKEN", "genoma_secret")


def verify_token(authorization: Optional[str] = Header(None)):
    """Verificar token de seguridad"""
    if authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Token inválido")


# ─────────────────────────────────────────────
# MODELOS Pydantic
# ─────────────────────────────────────────────

class TextRequest(BaseModel):
    text: str
    session_id: Optional[str] = "default"
    respond_with_audio: bool = True


class TextResponse(BaseModel):
    response_text: str
    audio_url: Optional[str] = None
    actions: Optional[list] = []
    session_id: str


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "🧬 IA-GENOMA activo", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "GENOMA", "provider": os.getenv("LLM_PROVIDER")}


@app.post("/voice", response_model=TextResponse)
async def process_voice(
    audio: UploadFile = File(...),
    session_id: Optional[str] = "default",
    authorization: Optional[str] = Header(None)
):
    """
    Endpoint principal: recibe audio, transcribe, procesa con el agente,
    devuelve texto + URL del audio de respuesta.
    """
    verify_token(authorization)

    # Guardar audio temporalmente
    suffix = "." + (audio.filename.split(".")[-1] if audio.filename else "wav")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 1. STT: Audio → Texto
        transcription = await transcribe_audio(tmp_path)
        if not transcription:
            raise HTTPException(status_code=400, detail="No se pudo transcribir el audio")

        print(f"[STT] Transcripción: {transcription}")

        # 2. Agente: Texto → Respuesta
        result = await agent.process(transcription, session_id)
        response_text = result["response"]
        actions = result.get("actions", [])

        print(f"[AGENT] Respuesta: {response_text}")

        # 3. TTS: Texto → Audio
        audio_filename = f"{uuid.uuid4()}.mp3"
        audio_path = os.path.join(tempfile.gettempdir(), audio_filename)
        await synthesize_speech(response_text, audio_path)

        return TextResponse(
            response_text=response_text,
            audio_url=f"/audio/{audio_filename}",
            actions=actions,
            session_id=session_id
        )
    finally:
        os.unlink(tmp_path)


@app.post("/text", response_model=TextResponse)
async def process_text(
    request: TextRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Endpoint de texto: para cuando ya tienes la transcripción o quieres
    interactuar directamente por texto.
    """
    verify_token(authorization)

    result = await agent.process(request.text, request.session_id)
    response_text = result["response"]
    actions = result.get("actions", [])

    audio_url = None
    if request.respond_with_audio:
        audio_filename = f"{uuid.uuid4()}.mp3"
        audio_path = os.path.join(tempfile.gettempdir(), audio_filename)
        await synthesize_speech(response_text, audio_path)
        audio_url = f"/audio/{audio_filename}"

    return TextResponse(
        response_text=response_text,
        audio_url=audio_url,
        actions=actions,
        session_id=request.session_id
    )


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Sirve los archivos de audio TTS generados"""
    audio_path = os.path.join(tempfile.gettempdir(), filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio no encontrado")
    return FileResponse(audio_path, media_type="audio/mpeg")


@app.delete("/memory/{session_id}")
async def clear_memory(
    session_id: str,
    authorization: Optional[str] = Header(None)
):
    """Limpia el historial de conversación de una sesión"""
    verify_token(authorization)
    agent.clear_memory(session_id)
    return {"status": "memoria limpiada", "session_id": session_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True") == "True"
    )
