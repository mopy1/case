import { useEffect, useLayoutEffect, useRef } from "react"
import { History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ChatMensaje } from "../types/chat.types"
import { ChatMessageItem } from "./chat-message-item"

interface ChatMessageListProps {
  mensajes: ChatMensaje[]
  yoId: number | null
  hayMas: boolean
  cargandoAnteriores: boolean
  onCargarAnteriores: () => void
}

export function ChatMessageList({
  mensajes,
  yoId,
  hayMas,
  cargandoAnteriores,
  onCargarAnteriores,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Distancia al fondo antes de anteponer anteriores, para que la vista no salte.
  const distanciaAlFondo = useRef<number | null>(null)
  const ultimoId = mensajes.at(-1)?.id
  const primerId = mensajes[0]?.id

  // Auto-scroll solo cuando llega un mensaje nuevo al final (no al anteponer).
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [ultimoId])

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
        <ChatMessageItem key={m.id} mensaje={m} esPropio={yoId !== null && m.usuarioId === yoId} />
      ))}
    </div>
  )
}
