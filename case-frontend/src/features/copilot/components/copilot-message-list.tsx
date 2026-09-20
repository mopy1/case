import { useEffect, useRef } from "react"
import { Bot, Loader2 } from "lucide-react"
import type { CopilotMessage } from "../types/copilot.types"
import { CopilotMessageItem, type CopilotMessageItemProps } from "./copilot-message-item"

interface CopilotMessageListProps
  extends Omit<CopilotMessageItemProps, "message" | "isSavingAdr" | "isApplyingAll"> {
  messages: CopilotMessage[]
  loading: boolean
  savingNoteId: string | null
  applyingAllMessageId?: string | null
}

export function CopilotMessageList({
  messages,
  loading,
  savingNoteId,
  applyingAllMessageId,
  ...itemProps
}: CopilotMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  return (
    <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3 sm:p-4 w-full">
      {messages.map((message) => (
        <CopilotMessageItem
          key={message.id}
          message={message}
          isSavingAdr={savingNoteId === message.id}
          isApplyingAll={applyingAllMessageId === message.id}
          {...itemProps}
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
