import { useEffect, useRef } from "react"
import { Bot, Loader2 } from "lucide-react"
import type { AdrSuggestion, CopilotMessage } from "../types/copilot.types"
import { CopilotMessageItem } from "./copilot-message-item"

interface CopilotMessageListProps {
  messages: CopilotMessage[]
  loading: boolean
  savingNoteId: string | null
  onSaveAdr: (messageId: string, adr: AdrSuggestion) => void
}

export function CopilotMessageList({
  messages,
  loading,
  savingNoteId,
  onSaveAdr,
}: CopilotMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <CopilotMessageItem
          key={message.id}
          message={message}
          isSavingAdr={savingNoteId === message.id}
          onSaveAdr={onSaveAdr}
        />
      ))}

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-border/60 bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-xs">
          <Bot className="size-3.5 text-primary animate-pulse" />
          <span>Consultando base de conocimiento...</span>
          <Loader2 className="size-3 animate-spin text-primary" />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
