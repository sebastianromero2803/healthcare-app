"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { MessageSquare, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "./use-toast"
import { Input } from "@/components/ui/input"
import { CookieManager } from "@/lib/cookie-manager"
import { cn } from "@/lib/utils"

interface ConversationSidebarProps {
  onSelectConversation: (conversation: any) => void
  onNewConversation: () => void
  currentConversationId: string
}

export function ConversationSidebar({
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: ConversationSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [conversations, setConversations] = useState(CookieManager.getSavedConversations())
  const editInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Update conversations when cookies change
  useEffect(() => {
    const updateConversations = () => {
      const saved = CookieManager.getSavedConversations()
      if (JSON.stringify(saved) !== JSON.stringify(conversations)) {
        setConversations(saved)
      }
    }

    // Check for updates every second
    const interval = setInterval(updateConversations, 1000)
    return () => clearInterval(interval)
  }, [conversations])

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const success = CookieManager.deleteConversation(id)

    if (success) {
      setConversations(CookieManager.getSavedConversations())
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed from your history",
      })
      // If the deleted conversation was selected, clear it
      if (id === currentConversationId) {
        onSelectConversation(null)
      }
    } else {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete the conversation. Please try again.",
      })
    }
  }

  const startEditing = (id: string, title: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingId(id)
    setEditingTitle(title)
    // Focus the input after it renders
    setTimeout(() => {
      editInputRef.current?.focus()
    }, 0)
  }

  const saveEdit = (id: string, event?: React.FormEvent) => {
    event?.preventDefault()

    if (editingTitle.trim()) {
      const conversations = CookieManager.getSavedConversations()
      const updatedConversations = conversations.map((conv) =>
        conv.id === id ? { ...conv, title: editingTitle.trim() } : conv,
      )

      const success = CookieManager.saveConversations(updatedConversations)
      if (success) {
        setConversations(updatedConversations)
        toast({
          title: "Title updated",
          description: "The conversation title has been updated",
        })
      }
    }

    setEditingId(null)
    setEditingTitle("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  if (isCollapsed) {
    return (
      <div className="hidden md:flex flex-col items-center py-4 border-r bg-gray-50/50 transition-all duration-300 ease-in-out">
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 rounded-full p-0 hover:bg-gray-100"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="hidden md:flex flex-col w-80 border-r bg-gray-50/50 h-screen transition-all duration-300 ease-in-out">
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h2 className="font-semibold text-sm">Saved Conversations</h2>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-gray-100"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={onNewConversation}>
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500">No saved conversations</div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                  "hover:bg-gray-100",
                  currentConversationId === conversation.id ? "bg-blue-50 hover:bg-blue-50" : "",
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <MessageSquare className="h-5 w-5 text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingId === conversation.id ? (
                    <form onSubmit={(e) => saveEdit(conversation.id, e)} className="flex items-center gap-2">
                      <Input
                        ref={editInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="h-7 text-sm"
                        placeholder="Enter conversation title"
                      />
                      <div className="flex items-center gap-1">
                        <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-green-100">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-red-100"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{conversation.title || "Untitled Conversation"}</p>
                      <p className="text-xs text-gray-500">{format(new Date(conversation.timestamp), "MMM d, yyyy")}</p>
                    </>
                  )}
                </div>
                {!editingId && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-200"
                      onClick={(e) => startEditing(conversation.id, conversation.title, e)}
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-200"
                      onClick={(e) => handleDelete(conversation.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

