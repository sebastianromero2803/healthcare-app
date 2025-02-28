from pathlib import Path
from openai import OpenAI
import os
from fastapi import HTTPException

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def text_to_speech_function(text: str, voice: str = "alloy", prompt: str = "") -> bytes:
  """
  Convert text to speech using OpenAI's Text-to-Speech API (hypothetical).
  
  Parameters:
    - text: The text to convert to speech.
    - voice: The voice variant for speech (default is "en-US-Wavenet-D").
  
  Returns:
    The audio data as bytes (this would be audio file data to send back to the user).
  """
  try:
    # Hypothetical TTS parameters
    response = client.audio.speech.create(
      model="tts-1",
      voice=voice,
      input=text,
    )

    audio_data = response.content

    if len(audio_data) == 0:
      raise HTTPException(status_code=400, detail="Empty audio data received")

    return audio_data

  except Exception as e:
      print(f"Error in text-to-speech conversion: {e}")
      raise e
