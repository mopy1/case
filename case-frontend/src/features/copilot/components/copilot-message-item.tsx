import { Bot, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChatMessageContent } from "@/features/chat/components/chat-message-content"
import type { CopilotMessage } from "../types/copilot.types"
import { CopilotApplyAllButton } from "./copilot-apply-all-button"
import { CopilotCardList, type CopilotCardListProps } from "./copilot-card-list"

export interface CopilotMessageItemProps extends Omit<CopilotCardListProps, "message"> {
  message: CopilotMessage
  isApplyingAll?: boolean
  onApplyAll: (message: CopilotMessage) => void
}

/** Renderiza un mensaje individual en Copilot unificando estética y Markdown con ChatTeam. */
export function CopilotMessageItem({
  message,
  isApplyingAll,
  onApplyAll,
  ...cardListProps
}: CopilotMessageItemProps) {
  const isUser = message.sender === "user"

  if (isUser) {
    return (
      <div className="flex w-full max-w-full flex-col items-end gap-1">
        <div className="max-w-[88%] rounded-2xl rounded-tr-xs bg-primary px-3 py-2 text-xs text-primary-foreground shadow-xs">
          {message.imageUrl && (
            <div className="mb-2 overflow-hidden rounded-lg border border-primary-foreground/20 bg-black/10">
              <img src={message.imageUrl} alt="Diagrama adjunto" className="max-h-52 w-auto object-contain rounded-md" />
            </div>
          )}
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
        </div>
        <span className="px-1 text-[10px] text-muted-foreground">{message.timestamp}</span>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-full items-start gap-2.5">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback className="border border-primary/30 bg-primary/10 text-primary">
          <Bot className="size-3.5" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1.5 overflow-hidden">
        <header className="flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-foreground">Copilot</span>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 px-1.5 py-0 text-[9px] text-primary">
            <Sparkles className="mr-0.5 size-2.5" /> Asistente · IA
          </Badge>
          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
        </header>

        <div className="rounded-2xl rounded-tl-xs border border-border/70 bg-card px-3 py-2 text-xs text-card-foreground shadow-xs">
          <ChatMessageContent text={message.text} />
        </div>

        <CopilotApplyAllButton message={message} isApplyingAll={!!isApplyingAll} onApplyAll={onApplyAll} />
        <CopilotCardList message={message} {...cardListProps} />
      </div>
    </div>
  )
}
