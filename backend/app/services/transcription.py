import whisper
import tempfile
import os
from fastapi import UploadFile

# Load the Whisper model once when the module is imported
model = whisper.load_model("base")

async def transcribe_audio(file: UploadFile) -> str:
    # Read the uploaded file contents
    contents = await file.read()
    
    # Write the audio content to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Transcribe the audio using Whisper
        result = model.transcribe(tmp_path)
        transcript = result.get("text", "").strip()
    finally:
        # Remove the temporary file
        os.remove(tmp_path)
    
    return transcript
