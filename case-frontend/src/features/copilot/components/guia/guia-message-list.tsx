import { ChatAgentStatus, ChatThread, ChatThreadItem } from "@/components/chat"
import type { GuiaMensaje } from "../../types/copilot.types"
import { GuiaMessageItem } from "./guia-message-item"

/** Hilo de la Guía sobre el mismo `ChatThread` del Equipo y del Asistente. */
export function GuiaMessageList({ mensajes, loading }: { mensajes: GuiaMensaje[]; loading: boolean }) {
  return (
    <ChatThread>
      {mensajes.map((m) => (
        <ChatThreadItem key={m.id} messageId={m.id}>
          <GuiaMessageItem mensaje={m} />
        </ChatThreadItem>
      ))}
      {loading && (
        <ChatThreadItem messageId="guia-pensando">
          <ChatAgentStatus agentName="Guía" label="Buscando en el manual…" />
        </ChatThreadItem>
      )}
    </ChatThread>
  )
}
