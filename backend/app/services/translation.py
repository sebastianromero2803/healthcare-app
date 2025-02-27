import openai

async def translate_text(text: str, target_language: str) -> str:
    prompt = (
        f"Translate the following text to {target_language}:\n\n"
        f"Text: {text}\n\n"
        "Translation:"
    )
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful translator."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500,
        temperature=0.3,
    )
    
    translation = response.choices[0].message.content.strip()
    return translation
