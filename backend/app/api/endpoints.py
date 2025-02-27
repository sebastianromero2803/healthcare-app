from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from models.request_models import TranslationRequest
from services import transcription, translation

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    response_format: str = Query("text", description="Response format: 'text' or 'verbose_json'"),
    prompt: str = Query(None, description="Optional prompt to improve transcription accuracy (e.g., medical terms)"),
):
    try:
        transcript = await transcription.transcribe_audio(file, response_format=response_format, prompt=prompt)
        if not transcript:
            raise HTTPException(status_code=400, detail="Transcription failed")
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {e}")

@router.post("/translate")
async def translate_text(
    payload: TranslationRequest,
    source_language: str = Query(..., description="Language code of the input text (e.g., 'en')"),
    target_language: str = Query(..., description="Language code for the output (e.g., 'es')"),
):
    try:
        translated_text = await translation.translate_text(payload.text, source_language, target_language)
        if not translated_text:
            raise HTTPException(status_code=400, detail="Translation failed")
        return {"translation": translated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {e}")
