export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend-healthcare-translator.vercel.app"

export const API_CONFIG = {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Origin: typeof window !== "undefined" ? window.location.origin : "",
  },
  mode: "cors" as RequestMode,
  credentials: "include" as RequestCredentials,
  retries: 3,
  retryDelay: 1000,
}

export const TTS_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  chunkSize: 1000,
  voices: {
    en: "alloy",
    es: "nova",
    fr: "alloy",
    de: "alloy",
    zh: "nova",
    ar: "alloy",
    ru: "alloy",
    hi: "nova",
    pt: "alloy",
    ja: "nova",
  } as const,
} as const

// Medical-specific prompts to improve API responses
export const MEDICAL_PROMPTS = {
  transcription:
    "The audio contains medical terminology related to patient symptoms, diagnoses, or treatment plans. Please accurately transcribe medical terms, drug names, and anatomical references.",

  translation:
    "This is a medical conversation between a healthcare provider and patient. Please maintain medical accuracy and context while translating. Preserve medical terminology where appropriate or provide culturally relevant explanations.",

  textToSpeech:
    "This is medical content that should be pronounced clearly, especially medical terminology, drug names, and dosage instructions.",
}

// Language information with medical specialization notes
export const LANGUAGES = [
  { code: "en", name: "English", medicalNote: "Standard medical terminology" },
  { code: "es", name: "Spanish", medicalNote: "Latin American medical terms may differ from European Spanish" },
  { code: "fr", name: "French", medicalNote: "Uses French-specific medical terminology" },
  { code: "de", name: "German", medicalNote: "Precise medical terminology with compound words" },
  { code: "zh", name: "Chinese", medicalNote: "Traditional medicine terms may require special attention" },
  { code: "ar", name: "Arabic", medicalNote: "Right-to-left script with specific medical vocabulary" },
  { code: "ru", name: "Russian", medicalNote: "Cyrillic script with specific medical terminology" },
  { code: "hi", name: "Hindi", medicalNote: "May mix English medical terms with Hindi" },
  { code: "pt", name: "Portuguese", medicalNote: "Brazilian and European variants have different medical terms" },
  { code: "ja", name: "Japanese", medicalNote: "Uses specific medical kanji and terminology" },
]

// Role-specific language configuration
export const ROLES = {
  DOCTOR: "doctor",
  PATIENT: "patient",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Error messages
export const ERROR_MESSAGES = {
  microphoneAccess:
    "Could not access microphone. Please check permissions and ensure your device has a working microphone.",
  transcriptionFailed:
    "Could not transcribe audio. Please try speaking more clearly or check your internet connection.",
  translationFailed: "Translation failed. Please try again or select a different language pair.",
  playbackFailed: "Could not play audio. Please try again or check your device audio settings.",
  sessionError: "Could not create or retrieve session. Please refresh the page.",
  unauthorized: "Authentication required. Please check your credentials or contact support.",
  connectionError: "Could not connect to the translation service. Please check your internet connection.",
  ttsError: "Text-to-speech conversion failed. The text might be too long or contain unsupported characters.",
  networkError: "Network error occurred. Please check your connection and try again.",
}

