import { ChatAgentStatus, ChatDaySeparator, ChatThread, ChatThreadItem, cambiaDeDia, debeAgrupar } from "@/components/chat"
import type { ChatMessageVariant } from "@/components/chat"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { nombreAutor } from "../lib/chatFormat"
import type { ChatIaEstadoEvent, ChatMensaje } from "../types/chat.types"
import { ChatMessageItem } from "./chat-message-item"

interface ChatMessageListProps {
  mensajes: ChatMensaje[]
  yoId: number | null
  miUsername?: string
  hayMas: boolean
  cargandoAnteriores: boolean
  onCargarAnteriores: () => void
  iaEstado?: ChatIaEstadoEvent | null
  miRol?: RolProyecto | null
  proyectoId: number
}

function varianteDe(m: ChatMensaje, yoId: number | null): ChatMessageVariant {
  if (m.tipo === "IA") return "agent"
  if (m.tipo === "SISTEMA") return "system"
  return yoId !== null && m.usuarioId === yoId ? "own" : "peer"
}

/** Hilo del Equipo: separador de día, agrupación por autor y estado de Senior Dev. */
export function ChatMessageList({ mensajes, yoId, miUsername, hayMas, cargandoAnteriores, onCargarAnteriores, iaEstado, miRol, proyectoId }: ChatMessageListProps) {
  return (
    <ChatThread hasMore={hayMas} loadingMore={cargandoAnteriores} onLoadMore={onCargarAnteriores}>
      {mensajes.map((m, i) => {
        const prev = mensajes[i - 1]
        const variant = varianteDe(m, yoId)
        const nuevoDia = cambiaDeDia(prev?.createdAt, m.createdAt)
        const grouped =
          !nuevoDia &&
          debeAgrupar(
            prev && { autorKey: nombreAutor(prev), iso: prev.createdAt, variant: varianteDe(prev, yoId) },
            { autorKey: nombreAutor(m), iso: m.createdAt, variant }
          )
        return (
          <ChatThreadItem key={m.id} messageId={String(m.id)}>
            {nuevoDia && <ChatDaySeparator iso={m.createdAt} />}
            <ChatMessageItem
              mensaje={m}
              variant={variant}
              grouped={grouped}
              mensajes={mensajes}
              miUsername={miUsername}
              miRol={miRol}
              proyectoId={proyectoId}
            />
          </ChatThreadItem>
        )
      })}
      {iaEstado?.estado === "PENSANDO" && (
        <ChatThreadItem messageId="ia-pensando">
          <ChatAgentStatus agentName="Senior Dev" label={iaEstado.detalle || "Leyendo el proyecto…"} />
        </ChatThreadItem>
      )}
    </ChatThread>
  )
}
