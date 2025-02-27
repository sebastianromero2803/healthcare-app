from openai import OpenAI
import tempfile
import os
from fastapi import UploadFile

client = OpenAI()

async def transcribe_audio(file: UploadFile, 
                           response_format: str = "text",
                           prompt: str = None,
                           timestamp_granularities: list = None) -> str:
    """
    Transcribe an audio file using OpenAI's Audio Transcriptions API.
    
    Parameters:
      - file: the uploaded audio file.
      - response_format: "text" (default) or "verbose_json" for detailed output.
      - prompt: optional text prompt to help with specialized vocabulary (e.g. medical terms).
      - timestamp_granularities: list of granularity options (e.g. ["word"]) for timestamped output.
    
    Returns:
      The transcribed text (or detailed JSON if requested).
    """
    # Read the file contents asynchronously
    contents = await file.read()
    
    # Write contents to a temporary file and close it immediately
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        # Build parameters for the transcription API call
        params = {
            "model": "whisper-1",
            "response_format": response_format
        }
        if prompt:
            params["prompt"] = prompt
        if timestamp_granularities:
            params["timestamp_granularities"] = timestamp_granularities

        # Open the temporary file in a context manager to ensure it is closed after reading
        with open(tmp_path, "rb") as audio_file:
            params["file"] = audio_file
            transcription = client.audio.transcriptions.create(**params)
        
        # If response_format is "text", the API returns a plain string
        if response_format == "text":
            if isinstance(transcription, str):
                return transcription.strip()
            # Fallback in case it's a dict
            return transcription.get("text", "").strip()
        else:
            return transcription  # For verbose_json responses
    finally:
        # Remove the temporary file
        os.remove(tmp_path)
