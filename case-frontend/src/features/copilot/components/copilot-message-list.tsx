import { ChatAgentStatus, ChatThread, ChatThreadItem } from "@/components/chat"
import type { CopilotMessage } from "../types/copilot.types"
import { CopilotMessageItem, type CopilotMessageItemProps } from "./copilot-message-item"

interface CopilotMessageListProps extends Omit<CopilotMessageItemProps, "message" | "isSavingAdr" | "isApplyingAll"> {
  messages: CopilotMessage[]
  loading: boolean
  savingNoteId: string | null
  applyingAllMessageId?: string | null
}

/** Hilo del Copilot sobre el mismo `ChatThread` del Equipo. */
export function CopilotMessageList({ messages, loading, savingNoteId, applyingAllMessageId, ...itemProps }: CopilotMessageListProps) {
  return (
    <ChatThread>
      {messages.map((message) => (
        <ChatThreadItem key={message.id} messageId={message.id}>
          <CopilotMessageItem
            message={message}
            isSavingAdr={savingNoteId === message.id}
            isApplyingAll={applyingAllMessageId === message.id}
            {...itemProps}
          />
        </ChatThreadItem>
      ))}
      {loading && (
        <ChatThreadItem messageId="copilot-pensando">
          <ChatAgentStatus agentName="Copilot" label="Leyendo el diagrama…" />
        </ChatThreadItem>
      )}
    </ChatThread>
  )
}
