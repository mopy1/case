import { ChatMessage, ChatMessageActions, MessageMarkdown, horaCorta } from "@/components/chat"
import type { ChatAuthor } from "@/components/chat"
import type { CopilotMessage } from "../types/copilot.types"
import { CopilotApplyAllButton } from "./copilot-apply-all-button"
import { CopilotCardList, type CopilotCardListProps } from "./copilot-card-list"

export interface CopilotMessageItemProps extends Omit<CopilotCardListProps, "message"> {
  message: CopilotMessage
  grouped?: boolean
  isApplyingAll?: boolean
  onApplyAll: (message: CopilotMessage) => void
}

const COPILOT: ChatAuthor = { id: "copilot", name: "Copilot", kind: "agent" }
const YO: ChatAuthor = { id: "yo", name: "Vos", kind: "human" }

/** Adaptador: `CopilotMessage` → `ChatMessage` (+ barra "Aplicar todos" y tarjetas). */
export function CopilotMessageItem({ message, grouped, isApplyingAll, onApplyAll, ...cardListProps }: CopilotMessageItemProps) {
  const own = message.sender === "user"
  const tone = !own && message.text.startsWith("**Error") ? "error" : "default"

  return (
    <ChatMessage
      variant={own ? "own" : "agent"}
      author={own ? YO : COPILOT}
      time={horaCorta(message.timestamp)}
      dateTime={message.timestamp}
      grouped={grouped}
      tone={tone}
      attachment={
        message.imageUrl && <img src={message.imageUrl} alt="Diagrama adjunto" className="mb-2 max-h-52 w-auto rounded-xl object-contain" />
      }
      actions={own ? undefined : <ChatMessageActions text={message.text} />}
      extras={
        own ? undefined : (
          <>
            <CopilotApplyAllButton message={message} isApplyingAll={!!isApplyingAll} onApplyAll={onApplyAll} />
            <CopilotCardList message={message} {...cardListProps} />
          </>
        )
      }
    >
      {own ? <p className="whitespace-pre-wrap">{message.text}</p> : <MessageMarkdown text={message.text} />}
    </ChatMessage>
  )
}
