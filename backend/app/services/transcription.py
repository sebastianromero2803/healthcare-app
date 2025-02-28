from openai import OpenAI
import tempfile
import os
from fastapi import UploadFile

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def transcribe_audio(file: UploadFile, 
                           response_format: str = "text",
                           prompt: str = None,
                           timestamp_granularities: list = None) -> str:
    """
    Transcribe an audio file using OpenAI's Audio Transcriptions API.s
    
    Parameters:
      - file: the uploaded audio file.
      - response_format: "text" (default) or "verbose_json" for detailed output.
      - prompt: optional text prompt to help with specialized vocabulary (e.g. medical terms).
      - timestamp_granularities: list of granularity options (e.g. ["word"]) for timestamped output.
    
    Returns:
      The transcribed text (or detailed JSON if requested).
    """
    # We need to reset the file position in case it's been read
    await file.seek(0)
    
    # Read the file contents
    contents = await file.read()
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(contents)
        tmp_path = tmp.name
    
    try:
        # Prepare transcription parameters
        transcription_params = {
            "model": "whisper-1",
            "response_format": response_format,
        }
        
        # Add optional parameters if provided
        if prompt:
            transcription_params["prompt"] = prompt
        if timestamp_granularities:
            transcription_params["timestamp_granularities"] = timestamp_granularities
        
        # Open the file and make the API call
        with open(tmp_path, "rb") as audio_file:
            # The key difference: directly pass the file object
            result = client.audio.transcriptions.create(
                file=audio_file,
                **transcription_params
            )
        
        # Handle the response based on the requested format
        if response_format == "text":
            # Modern OpenAI SDK returns an object with text attribute
            if hasattr(result, "text"):
                return result.text
            # It could also be a string directly
            elif isinstance(result, str):
                return result
            # It could be a dictionary with a text key
            elif isinstance(result, dict) and "text" in result:
                return result["text"]
            # Fallback: convert whatever we got to string
            else:
                return str(result)
        else:
            # For JSON format, return the raw result
            # The API endpoint will handle the conversion
            return result
            
    finally:
        # Clean up the temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)