import { ChatAvatar } from "@/components/chat"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { etiquetaRol } from "../lib/chatFormat"
import type { MentionItem } from "../types/mention.types"

interface ChatMentionItemProps {
  item: MentionItem
  seleccionado: boolean
  onSelect: () => void
  onHover: () => void
}

/** Renglón de sugerencia de mención: avatar, @usuario y rol (o IA). */
export function ChatMentionItem({ item, seleccionado, onSelect, onHover }: ChatMentionItemProps) {
  return (
    <div
      role="option"
      aria-selected={seleccionado}
      onMouseDown={(e) => {
        e.preventDefault()
        onSelect()
      }}
      onMouseEnter={onHover}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm select-none",
        seleccionado ? "bg-accent text-accent-foreground" : "hover:bg-muted"
      )}
    >
      <ChatAvatar size="sm" author={{ id: item.id, name: item.username, kind: item.esIa ? "agent" : "human" }} />
      <span className="min-w-0 flex-1 truncate font-medium">@{item.username}</span>
      {item.esIa ? (
        <Badge variant="secondary">IA</Badge>
      ) : (
        item.rol && <span className="shrink-0 text-xs text-muted-foreground">{etiquetaRol(item.rol)}</span>
      )}
    </div>
  )
}
