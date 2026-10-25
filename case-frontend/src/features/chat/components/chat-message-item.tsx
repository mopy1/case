import { useMemo } from "react"
import { ChatMessage, ChatMessageActions, ChatQuote, MessageMarkdown, horaCorta } from "@/components/chat"
import type { ChatMessageVariant } from "@/components/chat"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { autorDe, nombreAutor } from "../lib/chatFormat"
import { parseChatProposal } from "../lib/chatProposalParser"
import type { ChatMensaje } from "../types/chat.types"
import { ChatProposalCard } from "./chat-proposal-card"

interface ChatMessageItemProps {
  mensaje: ChatMensaje
  variant: ChatMessageVariant
  grouped: boolean
  /** Para resolver la cita (`respuestaAId`). */
  mensajes: ChatMensaje[]
  miUsername?: string
  miRol?: RolProyecto | null
  proyectoId: number
}

/** Adaptador: `ChatMensaje` → `ChatMessage` (+ cita y tarjeta de propuesta del Senior Dev). */
export function ChatMessageItem({ mensaje, variant, grouped, mensajes, miUsername, miRol, proyectoId }: ChatMessageItemProps) {
  const mentionedMe = useMemo(
    () => Boolean(miUsername && new RegExp(`@${miUsername}\\b`, "i").test(mensaje.contenido)),
    [miUsername, mensaje.contenido]
  )
  const proposal = useMemo(
    () => (mensaje.tipo === "IA" ? parseChatProposal(mensaje, { messageId: mensaje.id, proyectoId, createdAt: mensaje.createdAt }) : null),
    [mensaje, proyectoId]
  )
  const texto = proposal ? proposal.textoLimpio : mensaje.contenido
  const citado = mensaje.respuestaAId ? mensajes.find((m) => m.id === mensaje.respuestaAId) : undefined

  return (
    <ChatMessage
      variant={variant}
      author={autorDe(mensaje)}
      time={horaCorta(mensaje.createdAt)}
      dateTime={mensaje.createdAt}
      grouped={grouped}
      mentionedMe={mentionedMe && variant !== "own"}
      quote={mensaje.respuestaAId ? <ChatQuote author={citado && nombreAutor(citado)} excerpt={citado?.contenido} /> : undefined}
      actions={variant === "agent" ? <ChatMessageActions text={texto} /> : undefined}
      extras={
        proposal && proposal.totalCambios > 0 ? (
          <ChatProposalCard proposal={proposal} miRol={miRol} proyectoId={proyectoId} isApplied={mensaje.propuestaAplicada} aplicadoPor={mensaje.aplicadoPor} />
        ) : undefined
      }
    >
      {variant === "system" ? texto : <MessageMarkdown text={texto} currentUsername={miUsername} />}
    </ChatMessage>
  )
}
