import type { CopilotMessage } from "../types/copilot.types"
import { CopilotApplyAllButton } from "./copilot-apply-all-button"
import { CopilotCardList, type CopilotCardListProps } from "./copilot-card-list"
import { renderFormattedContent } from "./copilot-text-formatter"

export interface CopilotMessageItemProps extends Omit<CopilotCardListProps, "message"> {
  message: CopilotMessage
  isApplyingAll?: boolean
  onApplyAll: (message: CopilotMessage) => void
}

export function CopilotMessageItem({
  message,
  isApplyingAll,
  onApplyAll,
  ...cardListProps
}: CopilotMessageItemProps) {
  const isUser = message.sender === "user"

  return (
    <div className={`flex flex-col gap-1.5 w-full max-w-full overflow-hidden ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`rounded-2xl px-3.5 py-2.5 text-xs break-words overflow-hidden ${
          isUser
            ? "max-w-[88%] rounded-tr-xs bg-primary text-primary-foreground shadow-xs"
            : "max-w-[98%] sm:max-w-[95%] rounded-tl-xs border border-border/70 bg-card text-card-foreground shadow-xs"
        }`}
      >
        {isUser ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : renderFormattedContent(message.text)}
      </div>

      {!isUser && (
        <CopilotApplyAllButton message={message} isApplyingAll={!!isApplyingAll} onApplyAll={onApplyAll} />
      )}

      {!isUser && <CopilotCardList message={message} {...cardListProps} />}

      <span className="px-1 text-[10px] text-muted-foreground">{message.timestamp}</span>
    </div>
  )
}
