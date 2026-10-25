import { Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { etiquetaRol, horaCorta, nombreAutor } from "../lib/chatFormat"
import type { ChatMensaje } from "../types/chat.types"

interface ChatMessageItemProps {
  mensaje: ChatMensaje
  esPropio: boolean
}

export function ChatMessageItem({ mensaje, esPropio }: ChatMessageItemProps) {
  const autor = nombreAutor(mensaje)
  const esIa = mensaje.tipo === "IA"

  return (
    <article className="flex gap-2.5">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback className={esIa ? "bg-primary/10 text-primary" : colorAvatar(mensaje.usuarioId ?? autor)}>
          {esIa ? <Bot className="size-3.5" /> : iniciales(autor)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <header className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-foreground">
            {autor}
            {esPropio && <span className="font-normal text-muted-foreground"> (vos)</span>}
          </span>
          {mensaje.rol && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-medium">
              {etiquetaRol(mensaje.rol)}
            </Badge>
          )}
          <time dateTime={mensaje.createdAt} className="text-[10px] text-muted-foreground">
            {horaCorta(mensaje.createdAt)}
          </time>
        </header>
        <p
          className={cn(
            "rounded-2xl rounded-tl-xs border px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words text-card-foreground shadow-xs",
            esPropio ? "border-primary/20 bg-primary/5" : "border-border/70 bg-card"
          )}
        >
          {mensaje.contenido}
        </p>
      </div>
    </article>
  )
}
