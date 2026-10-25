import { Bot, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ChatThinkingIndicatorProps {
  detalle?: string | null
}

/** Indicador visual reactivo cuando Senior Dev está procesando una consulta. */
export function ChatThinkingIndicator({ detalle }: ChatThinkingIndicatorProps) {
  return (
    <article className="flex gap-2.5 animate-in fade-in duration-300">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback className="border border-primary/30 bg-primary/10 text-primary">
          <Bot className="size-3.5 animate-pulse" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <header className="flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-foreground">Senior Dev</span>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 px-1.5 py-0 text-[9px] text-primary">
            <Sparkles className="mr-0.5 size-2.5" /> IA
          </Badge>
        </header>

        <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-xs border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground shadow-xs">
          <span>{detalle || "Senior Dev está analizando el proyecto..."}</span>
          <span className="inline-flex items-center gap-0.5 pl-1" aria-hidden="true">
            <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-primary/70" />
          </span>
        </div>
      </div>
    </article>
  )
}
