# Healthcare Translation Backend

This project implements a FastAPI-based backend for a healthcare translation web app. It uses OpenAI's Whisper for speech-to-text transcription and OpenAI's API for real-time translation. The app is designed to support medical terminology and provide a robust foundation for a multilingual, healthcare-focused application.

## Features

- **Audio Transcription:** Uses OpenAI's Whisper to transcribe spoken audio.
- **Real-Time Translation:** Leverages OpenAI's API for accurate text translation.
- **Modular Structure:** Organized code into modules (API endpoints, services, models, and utilities) for easy maintenance and scalability.
- **Security & Environment Management:** Sensitive keys are managed via a `.env` file and excluded from version control.
- **CORS Support:** Configured for cross-origin resource sharing, suitable for front-end integration.

## Getting Started

### Prerequisites

- Python 3.8 or higher.
- An OpenAI API key.

### Setup

1. **Clone the Repository:**

   ```bash
   git clone <repository_url>
   cd healthcare-translation-backend
