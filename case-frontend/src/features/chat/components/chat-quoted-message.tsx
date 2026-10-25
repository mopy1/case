import { CornerDownRight } from "lucide-react"
import { nombreAutor } from "../lib/chatFormat"
import type { ChatMensaje } from "../types/chat.types"

const MAX_CARACTERES_CITA = 70

interface ChatQuotedMessageProps {
  respuestaAId: number | null
  mensajes: ChatMensaje[]
}

/** Tarjeta compacta para citar el mensaje al que responde el autor o Senior Dev. */
export function ChatQuotedMessage({ respuestaAId, mensajes }: ChatQuotedMessageProps) {
  if (!respuestaAId) return null

  const citado = mensajes.find((m) => m.id === respuestaAId)
  if (!citado) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border-l-2 border-muted-foreground/30 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground italic">
        <CornerDownRight className="size-3 shrink-0" />
        <span>En respuesta a un mensaje anterior</span>
      </div>
    )
  }

  const autor = nombreAutor(citado)
  const recortado = citado.contenido.length > MAX_CARACTERES_CITA
    ? `${citado.contenido.slice(0, MAX_CARACTERES_CITA)}…`
    : citado.contenido

  return (
    <div className="flex items-center gap-1.5 rounded-md border-l-2 border-primary/60 bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
      <CornerDownRight className="size-3 shrink-0 text-primary/70" />
      <span className="truncate">
        <span className="font-semibold text-foreground/90">@{autor}</span>: {recortado}
      </span>
    </div>
  )
}
