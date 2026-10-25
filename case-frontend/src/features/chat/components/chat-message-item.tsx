import { Bot, Info, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { etiquetaRol, horaCorta, nombreAutor } from "../lib/chatFormat"
import type { ChatMensaje } from "../types/chat.types"
import { ChatMessageContent } from "./chat-message-content"
import { ChatQuotedMessage } from "./chat-quoted-message"

interface ChatMessageItemProps {
  mensaje: ChatMensaje
  esPropio: boolean
  mensajes: ChatMensaje[]
}

/** Renderiza un mensaje individual con variantes para IA, Sistema y miembros del equipo. */
export function ChatMessageItem({ mensaje, esPropio, mensajes }: ChatMessageItemProps) {
  const autor = nombreAutor(mensaje)
  const esIa = mensaje.tipo === "IA"
  const esSistema = mensaje.tipo === "SISTEMA"

  return (
    <article className="flex gap-2.5">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback
          className={cn(
            esIa && "border border-primary/30 bg-primary/10 text-primary",
            esSistema && "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            !esIa && !esSistema && colorAvatar(mensaje.usuarioId ?? autor)
          )}
        >
          {esIa && <Bot className="size-3.5" />}
          {esSistema && <Info className="size-3.5" />}
          {!esIa && !esSistema && iniciales(autor)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <header className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-foreground">
            {esIa ? "Senior Dev" : autor}
            {esPropio && <span className="font-normal text-muted-foreground"> (vos)</span>}
          </span>
          {esIa && (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 px-1.5 py-0 text-[9px] text-primary">
              <Sparkles className="mr-0.5 size-2.5" /> Senior Dev · IA
            </Badge>
          )}
          {esSistema && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-700 dark:text-amber-300"
            >
              Sistema
            </Badge>
          )}
          {mensaje.rol && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-medium">
              {etiquetaRol(mensaje.rol)}
            </Badge>
          )}
          <time dateTime={mensaje.createdAt} className="text-[10px] text-muted-foreground">
            {horaCorta(mensaje.createdAt)}
          </time>
        </header>

        <div
          className={cn(
            "space-y-1.5 rounded-2xl rounded-tl-xs border px-3 py-2 text-xs text-card-foreground shadow-xs",
            esIa && "border-primary/30 bg-primary/5 dark:bg-primary/10",
            esSistema && "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200",
            !esIa && !esSistema && esPropio && "border-primary/20 bg-primary/5",
            !esIa && !esSistema && !esPropio && "border-border/70 bg-card"
          )}
        >
          <ChatQuotedMessage respuestaAId={mensaje.respuestaAId} mensajes={mensajes} />
          <ChatMessageContent contenido={mensaje.contenido} />
        </div>
      </div>
    </article>
  )
}
