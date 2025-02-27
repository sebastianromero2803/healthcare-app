# Healthcare Translation Backend

This project implements a FastAPI-based backend for a healthcare translation web app. It uses OpenAI's Whisper for audio transcription and OpenAI's API for real-time translation. The design focuses on real-time, multilingual translation between patients and healthcare providers.

## Features

- **Voice-to-Text with Generative AI:** Uses OpenAI's Whisper to transcribe spoken input, with enhanced handling of medical terminology.
- **Real-Time Translation:** Leverages OpenAI's API to translate transcripts on the fly. The `/translate` endpoint accepts the source and target languages as query parameters.
- **Modular Structure:** Organized into endpoints, services, models, and utilities for maintainability.
- **Security & Environment Management:** Sensitive data (API keys) are managed using a `.env` file (excluded from version control).
- **Cross-Origin Support:** Configured CORS for seamless integration with frontend applications.

## Prerequisites

- Python 3.8 or higher.
- [ffmpeg](https://ffmpeg.org/download.html) installed and available on your PATH.
- An OpenAI API key.

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd healthcare-translation-backend
