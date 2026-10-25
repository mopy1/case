import { useEffect, useLayoutEffect, useRef } from "react"
import { History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import type { ChatIaEstadoEvent, ChatMensaje } from "../types/chat.types"
import { ChatMessageItem } from "./chat-message-item"
import { ChatThinkingIndicator } from "./chat-thinking-indicator"

interface ChatMessageListProps {
  mensajes: ChatMensaje[]
  yoId: number | null
  hayMas: boolean
  cargandoAnteriores: boolean
  onCargarAnteriores: () => void
  iaEstado?: ChatIaEstadoEvent | null
  miRol?: RolProyecto | null
  proyectoId?: number
}

/** Lista scrolleable con auto-scroll a mensajes recientes y soporte para indicador de IA. */
export function ChatMessageList({
  mensajes,
  yoId,
  hayMas,
  cargandoAnteriores,
  onCargarAnteriores,
  iaEstado,
  miRol,
  proyectoId,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const distanciaAlFondo = useRef<number | null>(null)
  const ultimoId = mensajes.at(-1)?.id
  const primerId = mensajes[0]?.id
  const estaPensando = iaEstado?.estado === "PENSANDO"

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [ultimoId, estaPensando])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || distanciaAlFondo.current === null) return
    el.scrollTop = el.scrollHeight - distanciaAlFondo.current
    distanciaAlFondo.current = null
  }, [primerId])

  function handleCargarAnteriores() {
    const el = scrollRef.current
    if (el) distanciaAlFondo.current = el.scrollHeight - el.scrollTop
    onCargarAnteriores()
  }

  return (
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
      {hayMas && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" disabled={cargandoAnteriores} onClick={handleCargarAnteriores}>
            {cargandoAnteriores ? <Loader2 className="animate-spin" /> : <History />}
            Cargar anteriores
          </Button>
        </div>
      )}
      {mensajes.map((m) => (
        <ChatMessageItem
          key={m.id}
          mensaje={m}
          esPropio={yoId !== null && m.usuarioId === yoId}
          mensajes={mensajes}
          miRol={miRol}
          proyectoId={proyectoId ?? m.proyectoId}
        />
      ))}
      {estaPensando && <ChatThinkingIndicator detalle={iaEstado?.detalle} />}
    </div>
  )
}
