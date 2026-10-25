import { useMemo } from "react"
import { ChatMessage, ChatMessageActions, ChatQuote, MessageMarkdown, horaCorta } from "@/components/chat"
import type { ChatMessageVariant } from "@/components/chat"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { autorDe, nombreAutor } from "../lib/chatFormat"
import { fuentesIa } from "../lib/chatIaFuentes"
import { parseChatProposal } from "../lib/chatProposalParser"
import type { ChatMensaje } from "../types/chat.types"
import { ChatDdlCard } from "./chat-ddl-card"
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
  /** F4: solo llega si el rol puede escribir (ADMIN/COLABORADOR); recibe el texto ya sin comandos. */
  onGuardarAdr?: (mensaje: ChatMensaje, textoLimpio: string) => void
}

/** Adaptador: `ChatMensaje` → `ChatMessage` (+ cita, fuentes, acciones y tarjeta de propuesta o DDL del Senior Dev). */
export function ChatMessageItem(props: ChatMessageItemProps) {
  const { mensaje, variant, grouped, mensajes, miUsername, miRol, proyectoId, onGuardarAdr } = props
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
  const agente = variant === "agent"

  function extras() {
    if (!proposal) return undefined
    if (proposal.totalCambios > 0) {
      return <ChatProposalCard proposal={proposal} miRol={miRol} proyectoId={proyectoId} isApplied={mensaje.propuestaAplicada} aplicadoPor={mensaje.aplicadoPor} />
    }
    return proposal.pideDdl ? <ChatDdlCard proyectoId={proyectoId} /> : undefined
  }

  return (
    <ChatMessage
      variant={variant}
      author={autorDe(mensaje)}
      time={horaCorta(mensaje.createdAt)}
      dateTime={mensaje.createdAt}
      grouped={grouped}
      mentionedMe={mentionedMe && variant !== "own"}
      quote={mensaje.respuestaAId ? <ChatQuote author={citado && nombreAutor(citado)} excerpt={citado?.contenido} /> : undefined}
      sources={agente ? fuentesIa(mensaje.herramientasUsadas) : undefined}
      actions={agente ? <ChatMessageActions text={texto} onSaveAdr={onGuardarAdr && (() => onGuardarAdr(mensaje, texto))} /> : undefined}
      extras={extras()}
    >
      {variant === "system" ? texto : <MessageMarkdown text={texto} currentUsername={miUsername} />}
    </ChatMessage>
  )
}
