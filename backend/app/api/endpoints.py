from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.models.request_models import TranslationRequest
from app.services import transcription, translation, text_to_speech
from fastapi.responses import StreamingResponse
import io

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

@router.post("/synthesize_speech")
async def synthesize_speech(
    payload: TranslationRequest,  # The request payload containing the text to convert
    voice: str = Query("alloy", description="The voice to be used (e.g. Alloy)"),  # The voice or language to be used (e.g., "en_us", "es", "alloy")
    prompt: str = Query(None, description="Optional prompt to improve speech synthesis accuracy (e.g., medical terms)"),  # Optional prompt to improve speech synthesis accuracy
):
    try:
        # Convert text to speech
        audio_data = await text_to_speech.text_to_speech_function(payload.text, voice=voice, prompt=prompt)

        with open("output.mp3", "wb") as f:
            f.write(audio_data)
        # Return the audio data as a streaming response
        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/mp3")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-Speech conversion failed: {str(e)}")

