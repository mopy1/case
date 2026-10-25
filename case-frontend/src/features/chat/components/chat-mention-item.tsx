import { Bot, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { etiquetaRol } from "../lib/chatFormat"
import type { MentionItem } from "../types/mention.types"

interface ChatMentionItemProps {
  item: MentionItem
  seleccionado: boolean
  onSelect: () => void
  onHover: () => void
}

/**
 * Renglón de sugerencia de mención con avatar, nombre de usuario y badges de rol o IA.
 */
export function ChatMentionItem({
  item,
  seleccionado,
  onSelect,
  onHover,
}: ChatMentionItemProps) {
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
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors select-none",
        seleccionado
          ? "bg-accent text-accent-foreground font-medium"
          : "hover:bg-muted/70 text-foreground"
      )}
    >
      <Avatar size="sm" className="size-6 shrink-0">
        <AvatarFallback
          className={cn(
            "text-[10px]",
            item.esIa
              ? "border border-primary/30 bg-primary/10 text-primary"
              : colorAvatar(item.id)
          )}
        >
          {item.esIa ? <Bot className="size-3.5" /> : iniciales(item.username)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-foreground">@{item.username}</span>
          {!item.esIa && item.nombreMostrar !== item.username && (
            <span className="text-[11px] text-muted-foreground truncate">
              ({item.nombreMostrar})
            </span>
          )}
        </div>

        {item.esIa ? (
          <Badge
            variant="outline"
            className="shrink-0 border-primary/30 bg-primary/10 px-1.5 py-0 text-[9px] text-primary"
          >
            <Sparkles className="mr-0.5 size-2.5" /> IA
          </Badge>
        ) : (
          item.rol && (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[9px] font-medium">
              {etiquetaRol(item.rol)}
            </Badge>
          )
        )}
      </div>
    </div>
  )
}
