"use client"

import { useState, useRef, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Mic, MicOff, Loader2, RefreshCw, Info, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ConversationTranscript from "@/components/conversation-transcript"
import { useToast } from "./use-toast"
import { Toaster } from "@/components/ui/toaster"
import { API_BASE_URL, LANGUAGES, MEDICAL_PROMPTS, ERROR_MESSAGES, ROLES, type Role } from "@/lib/api-config"
import { LanguageRoleSelector } from "./language-role-selector"

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        console.log(`Retrying ${url}, ${retries} retries remaining`)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retrying
        return fetchWithRetry(url, options, retries - 1)
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }
    return response
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying ${url} after error: ${error}, ${retries} retries remaining`)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retrying
      return fetchWithRetry(url, options, retries - 1)
    } else {
      throw error
    }
  }
}

const TTS_CONFIG = {
  chunkSize: 200,
  voices: {
    es: "es-ES-Neural",
    fr: "fr-FR-Neural",
    de: "de-DE-Neural",
    // Add more languages and voices as needed
  },
}

export default function TranslationInterface() {
  // State
  const [sessionId, setSessionId] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [originalText, setOriginalText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [conversation, setConversation] = useState<any[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking")
  const [currentRole, setCurrentRole] = useState<Role>(ROLES.DOCTOR)
  const [doctorLanguage, setDoctorLanguage] = useState("en")
  const [patientLanguage, setPatientLanguage] = useState("es")

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetchWithRetry(`${API_BASE_URL}/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        })
        if (response.ok) {
          setConnectionStatus("connected")
          toast({
            title: "Connected to backend",
            description: "Successfully connected to the translation service",
          })
        }
      } catch (error) {
        console.error("Backend connection error:", error)
        setConnectionStatus("error")
        const errorMessage =
          error instanceof Error && error.message.includes("Unauthorized")
            ? ERROR_MESSAGES.unauthorized
            : ERROR_MESSAGES.connectionError
        toast({
          variant: "destructive",
          title: "Connection error",
          description: errorMessage,
        })
      }
    }

    checkConnection()
  }, [toast])

  // Initialize session
  useEffect(() => {
    const newSessionId = uuidv4()
    setSessionId(newSessionId)
    console.log(`New session created: ${newSessionId}`)
  }, [])

  // Fetch conversation history when session changes
  useEffect(() => {
    if (sessionId && connectionStatus === "connected") {
      fetchConversation()
    }
  }, [sessionId, connectionStatus])

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
    }
  }, [])

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [])

  // Fetch conversation history
  const fetchConversation = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation || [])
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
    }
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = handleRecordingStop
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: ERROR_MESSAGES.microphoneAccess,
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle recording stop
  const handleRecordingStop = async () => {
    setIsProcessing(true)

    try {
      // Convert to webm format which is more widely supported
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" })
      const formData = new FormData()
      formData.append("file", audioBlob, "recording.webm")
      formData.append("prompt", MEDICAL_PROMPTS.transcription)

      // Transcribe audio with retry logic
      const transcriptionResponse = await fetchWithRetry(`${API_BASE_URL}/transcribe`, {
        method: "POST",
        body: formData,
      })

      const transcriptionData = await transcriptionResponse.json()
      const transcribedText = transcriptionData.transcript
      setOriginalText(transcribedText)

      // Determine source and target languages based on current role
      const sourceLanguage = currentRole === ROLES.DOCTOR ? doctorLanguage : patientLanguage
      const targetLanguage = currentRole === ROLES.DOCTOR ? patientLanguage : doctorLanguage

      // Translate text with retry logic
      const translationResponse = await fetchWithRetry(
        `${API_BASE_URL}/translate?source_language=${sourceLanguage}&target_language=${targetLanguage}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: transcribedText,
            prompt: MEDICAL_PROMPTS.translation,
          }),
        },
      )

      const translationData = await translationResponse.json()
      setTranslatedText(translationData.translation)

      // Add to conversation with correct role and language information
      await addToConversation(transcribedText, translationData.translation)

      toast({
        title: "Processing complete",
        description: "Your speech has been transcribed and translated",
      })
    } catch (error) {
      console.error("Error processing audio:", error)
      toast({
        variant: "destructive",
        title: "Processing failed",
        description:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Network error occurred. Please check your connection and try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Play translated text
  const playTranslatedText = async () => {
    if (!translatedText) return

    setIsPlaying(true)
    let audioUrl: string | null = null

    try {
      // Determine target language based on current role
      const targetLanguage = currentRole === ROLES.DOCTOR ? patientLanguage : doctorLanguage

      // Split long text into chunks if needed
      const textChunks =
        translatedText.length > TTS_CONFIG.chunkSize
          ? splitTextIntoChunks(translatedText, TTS_CONFIG.chunkSize)
          : [translatedText]

      const audioChunks: Blob[] = []

      // Process each chunk
      for (const chunk of textChunks) {
        const response = await fetchWithRetry(`${API_BASE_URL}/synthesize_speech`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: chunk,
            prompt: MEDICAL_PROMPTS.textToSpeech,
            voice: TTS_CONFIG.voices[targetLanguage] || "alloy",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `Server error: ${response.status}`)
        }

        const audioBlob = await response.blob()
        if (audioBlob.size === 0) {
          throw new Error("Received empty audio data")
        }

        audioChunks.push(audioBlob)
      }

      // Combine audio chunks
      const combinedBlob = new Blob(audioChunks, { type: "audio/mpeg" })
      audioUrl = URL.createObjectURL(combinedBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onended = () => {
          setIsPlaying(false)
          if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
        audioRef.current.onerror = (e) => {
          console.error("Audio playback error:", e)
          throw new Error("Audio playback failed")
        }
        await audioRef.current.play()
      }
    } catch (error) {
      console.error("Error playing audio:", error)
      setIsPlaying(false)

      if (audioUrl) URL.revokeObjectURL(audioUrl)

      toast({
        variant: "destructive",
        title: "Playback failed",
        description:
          error instanceof Error
            ? error.message.includes("Server error")
              ? ERROR_MESSAGES.ttsError
              : error.message
            : ERROR_MESSAGES.networkError,
      })
    }
  }

  // Helper function to split text into chunks
  const splitTextIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks: string[] = []
    let currentChunk = ""

    // Split by sentences to avoid cutting in the middle
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= chunkSize) {
        currentChunk += sentence
      } else {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = sentence
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim())
    return chunks
  }

  // Add to conversation
  const addToConversation = async (original: string, translated: string) => {
    try {
      await fetchWithRetry(`${API_BASE_URL}/conversation/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_text: original,
          translated_text: translated,
          source_role: currentRole,
        }),
      })

      // Update local conversation state
      setConversation((prev) => [
        ...prev,
        {
          original_text: original,
          translated_text: translated,
          timestamp: new Date().toISOString(),
          source_role: currentRole,
        },
      ])
    } catch (error) {
      console.error("Error adding to conversation:", error)
      // Still update local state even if server fails
      setConversation((prev) => [
        ...prev,
        {
          original_text: original,
          translated_text: translated,
          timestamp: new Date().toISOString(),
          source_role: currentRole,
        },
      ])

      toast({
        variant: "destructive",
        title: "Sync error",
        description: "Could not save to server, but your conversation is saved locally.",
      })
    }
  }

  // Swap languages
  const swapLanguages = () => {
    setDoctorLanguage(patientLanguage)
    setPatientLanguage(doctorLanguage)
  }

  // Get language medical note
  const getMedicalNote = (code: string) => {
    const language = LANGUAGES.find((lang) => lang.code === code)
    return language?.medicalNote || ""
  }

  return (
    <div className="space-y-6">
      {connectionStatus === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <p>
              <strong>Connection Error:</strong> Could not connect to the translation service. The application will work
              in demo mode with limited functionality.
            </p>
          </div>
        </div>
      )}

      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <LanguageRoleSelector
              role={ROLES.DOCTOR}
              language={doctorLanguage}
              onLanguageChange={setDoctorLanguage}
              label="Healthcare Provider's Language"
              tooltip="Select the language used by the healthcare provider"
            />

            <div className="flex items-end justify-center">
              <Button variant="ghost" size="icon" onClick={swapLanguages} className="mb-2">
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>

            <LanguageRoleSelector
              role={ROLES.PATIENT}
              language={patientLanguage}
              onLanguageChange={setPatientLanguage}
              label="Patient's Language"
              tooltip="Select the language used by the patient"
            />
          </div>

          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border p-1">
              <Button
                variant={currentRole === ROLES.DOCTOR ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentRole(ROLES.DOCTOR)}
              >
                Healthcare Provider
              </Button>
              <Button
                variant={currentRole === ROLES.PATIENT ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCurrentRole(ROLES.PATIENT)}
              >
                Patient
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Original</h3>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <span className="text-sm font-medium text-red-500 animate-pulse">
                      {formatRecordingTime(recordingTime)}
                    </span>
                  )}
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Record
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="min-h-[150px] p-4 rounded-md border bg-gray-50">
                {isProcessing ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-blue-800">Processing...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{originalText}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Translated</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playTranslatedText}
                  disabled={!translatedText || isPlaying}
                >
                  {isPlaying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              </div>
              <div className="min-h-[150px] p-4 rounded-md border bg-gray-50">
                <p className="whitespace-pre-wrap">{translatedText}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transcript">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="transcript">Conversation Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="transcript" className="mt-4">
          <ConversationTranscript
            conversation={conversation.map((item) => ({
              ...item,
              source_role: item.source_role || currentRole, // Fallback for existing items
            }))}
            doctorLanguage={doctorLanguage}
            patientLanguage={patientLanguage}
            apiBaseUrl={API_BASE_URL}
            medicalPrompt={MEDICAL_PROMPTS.textToSpeech}
          />
        </TabsContent>
      </Tabs>

      <audio ref={audioRef} className="hidden" />
      <Toaster />
    </div>
  )
}

