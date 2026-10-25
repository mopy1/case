import { Badge } from "@/components/ui/badge"
import type { ChatAuthor } from "./chat.types"

export interface ChatMessageMetaProps {
  author: ChatAuthor
  time: string
  dateTime?: string
  mentionedMe?: boolean
}

/** Cabecera en voz baja y en una línea: nombre · rol · IA · te mencionó · hora. */
export function ChatMessageMeta({ author, time, dateTime, mentionedMe }: ChatMessageMetaProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
      <span className="truncate font-medium text-foreground">{author.name}</span>
      {author.kind === "agent" && <Badge variant="secondary">IA</Badge>}
      {author.role && <span className="shrink-0">· {author.role}</span>}
      {mentionedMe && (
        <span className="flex shrink-0 items-center gap-1">
          · <span className="size-1.5 rounded-full bg-mention" aria-hidden="true" /> te mencionó
        </span>
      )}
      <time dateTime={dateTime} className="shrink-0 tabular-nums">
        · {time}
      </time>
    </div>
  )
}
