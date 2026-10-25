import { useMemo } from "react"
import { Bot, Info, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { etiquetaRol, horaCorta, nombreAutor } from "../lib/chatFormat"
import { parseChatProposal } from "../lib/chatProposalParser"
import type { ChatMensaje } from "../types/chat.types"
import { ChatMessageContent } from "./chat-message-content"
import { ChatProposalCard } from "./chat-proposal-card"
import { ChatQuotedMessage } from "./chat-quoted-message"

interface ChatMessageItemProps {
  mensaje: ChatMensaje
  esPropio: boolean
  mensajes: ChatMensaje[]
  miRol?: RolProyecto | null
  proyectoId?: number
}

/** Renderiza un mensaje individual con variantes para IA, Sistema, mención personal y miembros. */
export function ChatMessageItem({ mensaje, esPropio, mensajes, miRol, proyectoId }: ChatMessageItemProps) {
  const { user } = useAuth()
  const autor = nombreAutor(mensaje)
  const esIa = mensaje.tipo === "IA"
  const esSistema = mensaje.tipo === "SISTEMA"

  const esMencionadoYo = useMemo(() => {
    if (!user?.username) return false
    return new RegExp(`@${user.username}\\b`, "i").test(mensaje.contenido)
  }, [user, mensaje.contenido])

  const proposal = useMemo(() => {
    if (!esIa) return null
    return parseChatProposal(mensaje, {
      messageId: mensaje.id,
      proyectoId: proyectoId ?? mensaje.proyectoId,
      createdAt: mensaje.createdAt,
    })
  }, [esIa, mensaje, proyectoId])

  const contenidoVisible = proposal ? proposal.textoLimpio : mensaje.contenido

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
          {esMencionadoYo && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/20 px-1.5 py-0 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
              @ Te mencionaron
            </Badge>
          )}
          {esSistema && (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-700 dark:text-amber-300">
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
            !esIa && !esSistema && !esPropio && "border-border/70 bg-card",
            esMencionadoYo && "border-amber-500/50 bg-amber-500/5 dark:border-amber-400/50 dark:bg-amber-500/10 ring-1 ring-amber-500/30"
          )}
        >
          <ChatQuotedMessage respuestaAId={mensaje.respuestaAId} mensajes={mensajes} />
          <ChatMessageContent contenido={contenidoVisible} currentUsername={user?.username} />
          {proposal && proposal.totalCambios > 0 && (
            <ChatProposalCard proposal={proposal} miRol={miRol} proyectoId={proyectoId ?? mensaje.proyectoId} />
          )}
        </div>
      </div>
    </article>
  )
}
