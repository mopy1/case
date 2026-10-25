import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { ChatAgentStatus, ChatDaySeparator, ChatThread, ChatThreadItem, cambiaDeDia, debeAgrupar } from "@/components/chat"
import type { AgentStep, ChatMessageVariant } from "@/components/chat"
import type { NotaRequest } from "@/features/notes"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { borradorAdr } from "../lib/chatAdrDraft"
import { nombreAutor } from "../lib/chatFormat"
import { evaluarPermisosPropuesta } from "../types/chat-proposal.types"
import type { ChatMensaje } from "../types/chat.types"
import type { IaEnCurso } from "../hooks/useChatSala"
import { ChatMessageItem } from "./chat-message-item"
import { ChatSaveAdrDialog } from "./chat-save-adr-dialog"

interface ChatMessageListProps {
  mensajes: ChatMensaje[]
  yoId: number | null
  miUsername?: string
  hayMas: boolean
  cargandoAnteriores: boolean
  errorAnteriores?: string | null
  onCargarAnteriores: () => void
  iaEstado?: IaEnCurso | null
  miRol?: RolProyecto | null
  proyectoId: number
}

function varianteDe(m: ChatMensaje, yoId: number | null): ChatMessageVariant {
  if (m.tipo === "IA") return "agent"
  if (m.tipo === "SISTEMA") return "system"
  return yoId !== null && m.usuarioId === yoId ? "own" : "peer"
}

/** El 1.er `detalle` es la etiqueta general; los siguientes son herramientas (la última, en curso). */
function pasosDe(pasos: string[]): AgentStep[] {
  const herramientas = pasos.slice(1)
  return herramientas.map((label, i) => ({ id: `${i}-${label}`, label, state: i === herramientas.length - 1 ? "active" : "done" }))
}

/** Hilo del Equipo: separador de día, agrupación por autor, estado de Senior Dev y "Guardar como ADR". */
export function ChatMessageList(props: ChatMessageListProps) {
  const { mensajes, yoId, miUsername, hayMas, cargandoAnteriores, errorAnteriores, onCargarAnteriores, iaEstado, miRol, proyectoId } = props
  const [adr, setAdr] = useState<NotaRequest | null>(null)
  const [adrAbierto, setAdrAbierto] = useState(false)
  const puedeEscribir = evaluarPermisosPropuesta(miRol).puedeAplicar
  const abrirAdr = (m: ChatMensaje, texto: string) => {
    setAdr(borradorAdr(m, texto))
    setAdrAbierto(true)
  }

  const errorInline = errorAnteriores && (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="size-3.5 shrink-0" /> {errorAnteriores}
    </p>
  )

  return (
    <>
      <ChatThread hasMore={hayMas} loadingMore={cargandoAnteriores} onLoadMore={onCargarAnteriores} loadMoreSlot={errorInline || undefined}>
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
                onGuardarAdr={puedeEscribir ? abrirAdr : undefined}
              />
            </ChatThreadItem>
          )
        })}
        {iaEstado?.evento.estado === "PENSANDO" && (
          <ChatThreadItem messageId="ia-pensando">
            <ChatAgentStatus agentName="Senior Dev" label={iaEstado.pasos[0] ?? "Leyendo el proyecto…"} steps={pasosDe(iaEstado.pasos)} />
          </ChatThreadItem>
        )}
      </ChatThread>
      <ChatSaveAdrDialog open={adrAbierto} onOpenChange={setAdrAbierto} proyectoId={proyectoId} borrador={adr} />
    </>
  )
}
