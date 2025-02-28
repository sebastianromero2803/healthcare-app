import openai

async def translate_text(text: str, source_language: str, target_language: str) -> str:
    """
    Translate medical text from one language to another using the OpenAI Chat API.

    Parameters:
      - text: the input text to translate.
      - source_language: language code of the input text (e.g. "en" for English).
      - target_language: language code for the output (e.g. "es" for Spanish).
    
    Returns:
      The translated text.
    """
    # Construct a detailed prompt with clear instructions.
    # The system message sets the role and expected behavior.
    # The user message includes the text and translation instructions.
    messages = [
        {
            "role": "system", 
            "content": (
                "You are a medical translator. "
                "Your task is to translate text from the source language to the target language, "
                "with a focus on accuracy in medical terminology. "
                "Return only the translated text, with no additional commentary."
                "Make sure the text makes sense, is well structured and has no grammatical or syntactical errors."
            )
        },
        {
            "role": "user",
            "content": (
                f"Translate the following text from {source_language} to {target_language}:\n\n"
                f"{text}"
            )
        }
    ]
    
    response = openai.chat.completions.create(
        model="gpt-4o",  # Change this as needed (e.g. to gpt-4o if available)
        messages=messages,
        max_tokens=500,
        temperature=0.3,
    )
    
    # Extract and return the translated text.
    translation = response.choices[0].message.content.strip()
    return translation
