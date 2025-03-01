"use client"

import { useState, useRef } from "react"
import { Play, Download, Clock, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "./use-toast"
import { LANGUAGES, TTS_CONFIG, ROLES, type Role } from "@/lib/api-config"
import { fetchWithRetry } from "@/lib/fetch-with-retry"
import { ERROR_MESSAGES } from "@/lib/error-messages"
import { generatePDF } from "@/lib/pdf-generator"

interface ConversationSnippet {
  original_text: string
  translated_text: string
  timestamp: string
  source_role: Role
}

interface ConversationTranscriptProps {
  conversation: ConversationSnippet[]
  doctorLanguage: string
  patientLanguage: string
  apiBaseUrl: string
  medicalPrompt: string
}

export default function ConversationTranscript({
  conversation,
  doctorLanguage,
  patientLanguage,
  apiBaseUrl,
  medicalPrompt,
}: ConversationTranscriptProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "md">("pdf")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      return "Unknown time"
    }
  }

  // Format date
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return "Unknown date"
    }
  }

  // Play translated text
  const playTranslatedText = async (text: string, index: number) => {
    if (!text) return

    setPlayingIndex(index)
    let audioUrl: string | null = null

    try {
      const response = await fetchWithRetry(`${apiBaseUrl}/synthesize_speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          prompt: medicalPrompt,
          voice:
            patientLanguage in TTS_CONFIG.voices
              ? TTS_CONFIG.voices[patientLanguage as keyof typeof TTS_CONFIG.voices]
              : "alloy",
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

      audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onended = () => {
          setPlayingIndex(null)
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
      setPlayingIndex(null)

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

  // Download transcript
  const downloadTranscript = async () => {
    if (conversation.length === 0) {
      toast({
        variant: "destructive",
        title: "No conversation to download",
        description: "Record some conversation first",
      })
      return
    }

    setIsDownloading(true)

    try {
      const data = {
        title: "Healthcare Translation Transcript",
        generated: new Date().toLocaleString(),
        doctorLanguage: getLanguageName(doctorLanguage),
        patientLanguage: getLanguageName(patientLanguage),
        conversation: conversation.map((snippet) => ({
          ...snippet,
          timestamp: formatTimestamp(snippet.timestamp),
          date: formatDate(snippet.timestamp),
          role: snippet.source_role === ROLES.DOCTOR ? "Healthcare Provider" : "Patient",
        })),
      }

      if (downloadFormat === "pdf") {
        await generatePDF(data)
      } else {
        // Generate Markdown
        let content = `# ${data.title}\n\n`
        content += `Generated: ${data.generated}\n\n`
        content += `Healthcare Provider's Language: ${data.doctorLanguage}\n`
        content += `Patient's Language: ${data.patientLanguage}\n\n`

        // Group by date
        const groupedByDate = conversation.reduce(
          (acc, snippet) => {
            const date = formatDate(snippet.timestamp)
            if (!acc[date]) {
              acc[date] = []
            }
            acc[date].push(snippet)
            return acc
          },
          {} as Record<string, ConversationSnippet[]>,
        )

        // Generate content by date
        Object.entries(groupedByDate).forEach(([date, snippets]) => {
          content += `## ${date}\n\n`

          snippets.forEach((snippet, index) => {
            const timestamp = formatTimestamp(snippet.timestamp)
            const role = snippet.source_role === ROLES.DOCTOR ? "Healthcare Provider" : "Patient"
            content += `### Entry ${index + 1} - ${timestamp} (${role})\n\n`
            content += `#### Original (${
              snippet.source_role === ROLES.DOCTOR ? data.doctorLanguage : data.patientLanguage
            })\n${snippet.original_text}\n\n`
            content += `#### Translation (${
              snippet.source_role === ROLES.DOCTOR ? data.patientLanguage : data.doctorLanguage
            })\n${snippet.translated_text}\n\n`
            content += "---\n\n"
          })
        })

        // Add copyright
        content +=
          "© " + new Date().getFullYear() + " Healthcare Translation by Sebastian Romero. All rights reserved.\n"

        const blob = new Blob([content], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `medical-translation-transcript-${new Date().toISOString().slice(0, 10)}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Transcript downloaded",
        description: `Your conversation transcript has been saved as ${downloadFormat.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error downloading transcript:", error)
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the transcript. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Get language name from code
  const getLanguageName = (code: string) => {
    const language = LANGUAGES.find((lang) => lang.code === code)
    return language?.name || code
  }

  // Group conversations by date
  const groupedConversations = conversation.reduce(
    (acc, snippet) => {
      try {
        const date = formatDate(snippet.timestamp)
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(snippet)
        return acc
      } catch (error) {
        // Handle invalid dates
        const fallbackDate = "Unknown Date"
        if (!acc[fallbackDate]) {
          acc[fallbackDate] = []
        }
        acc[fallbackDate].push(snippet)
        return acc
      }
    },
    {} as Record<string, ConversationSnippet[]>,
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Conversation History</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDownloadFormat("md")}
            className={downloadFormat === "md" ? "bg-secondary" : ""}
          >
            <FileText className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDownloadFormat("pdf")}
            className={downloadFormat === "pdf" ? "bg-secondary" : ""}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTranscript}
            disabled={isDownloading || conversation.length === 0}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {conversation.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No conversation recorded yet.</p>
            <p className="text-sm">Start recording to see your transcript here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedConversations).map(([date, snippets]) => (
                <div key={date} className="space-y-4">
                  <div className="sticky top-0 bg-white z-10 py-2 flex items-center">
                    <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{date}</div>
                  </div>

                  {snippets.map((snippet, index) => {
                    const globalIndex = conversation.findIndex(
                      (s) => s.original_text === snippet.original_text && s.timestamp === snippet.timestamp,
                    )
                    const isDoctor = snippet.source_role === ROLES.DOCTOR
                    const sourceLanguage = isDoctor ? doctorLanguage : patientLanguage
                    const targetLanguage = isDoctor ? patientLanguage : doctorLanguage

                    return (
                      <div key={`${date}-${index}`} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatTimestamp(snippet.timestamp)}</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            {isDoctor ? "Healthcare Provider" : "Patient"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-md">
                            <div className="text-xs font-medium text-blue-700 mb-1">
                              {getLanguageName(sourceLanguage)}
                            </div>
                            <p className="text-sm">{snippet.original_text}</p>
                          </div>

                          <div className="bg-green-50 p-3 rounded-md">
                            <div className="flex justify-between items-center mb-1">
                              <div className="text-xs font-medium text-green-700">
                                {getLanguageName(targetLanguage)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => playTranslatedText(snippet.translated_text, globalIndex)}
                                disabled={playingIndex !== null}
                              >
                                {playingIndex === globalIndex ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                                <span className="sr-only">Play</span>
                              </Button>
                            </div>
                            <p className="text-sm">{snippet.translated_text}</p>
                            {playingIndex === globalIndex && (
                              <div className="mt-1 text-xs text-green-700">Playing...</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <audio ref={audioRef} className="hidden" />
    </Card>
  )
}

