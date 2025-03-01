import Cookies from "js-cookie"

interface SavedConversation {
  id: string
  title: string
  timestamp: string
  doctorLanguage: string
  patientLanguage: string
  snippets: Array<{
    original_text: string
    translated_text: string
    timestamp: string
    source_role: string
  }>
}

const COOKIE_KEY = "healthcare_conversations"
const MAX_CONVERSATIONS = 50 // Maximum number of saved conversations

export const CookieManager = {
  saveConversation: (conversation: SavedConversation) => {
    try {
      const saved = CookieManager.getSavedConversations()
      const existing = saved.findIndex((c) => c.id === conversation.id)

      if (existing !== -1) {
        // Update existing conversation while preserving the title
        const existingTitle = saved[existing].title
        saved[existing] = {
          ...conversation,
          title: conversation.title || existingTitle, // Keep existing title if new one is not provided
        }
      } else {
        // Remove oldest conversation if limit reached
        if (saved.length >= MAX_CONVERSATIONS) {
          saved.pop()
        }
        saved.unshift(conversation)
      }

      return CookieManager.saveConversations(saved)
    } catch (error) {
      console.error("Error saving conversation to cookies:", error)
      return false
    }
  },

  saveConversations: (conversations: SavedConversation[]) => {
    try {
      // Sort conversations by timestamp (newest first)
      const sorted = [...conversations].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )

      Cookies.set(COOKIE_KEY, JSON.stringify(sorted), { expires: 365 }) // Store for 1 year
      return true
    } catch (error) {
      console.error("Error saving conversations to cookies:", error)
      return false
    }
  },

  getSavedConversations: (): SavedConversation[] => {
    try {
      const saved = Cookies.get(COOKIE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error("Error reading conversations from cookies:", error)
      return []
    }
  },

  updateConversationSnippets: (id: string, snippets: any[]) => {
    try {
      const saved = CookieManager.getSavedConversations()
      const conversation = saved.find((c) => c.id === id)

      if (conversation) {
        conversation.snippets = snippets
        return CookieManager.saveConversations(saved)
      }
      return false
    } catch (error) {
      console.error("Error updating conversation snippets:", error)
      return false
    }
  },

  deleteConversation: (id: string) => {
    try {
      const saved = CookieManager.getSavedConversations()
      const filtered = saved.filter((c) => c.id !== id)
      return CookieManager.saveConversations(filtered)
    } catch (error) {
      console.error("Error deleting conversation from cookies:", error)
      return false
    }
  },

  clearAllConversations: () => {
    try {
      Cookies.remove(COOKIE_KEY)
      return true
    } catch (error) {
      console.error("Error clearing conversations from cookies:", error)
      return false
    }
  },
}

