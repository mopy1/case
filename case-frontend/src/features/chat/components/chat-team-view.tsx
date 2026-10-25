import { RotateCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useChatSala } from "../hooks/useChatSala"
import { ChatEmptyState } from "./chat-empty-state"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { ChatPresenceBar } from "./chat-presence-bar"
import { ChatSkeleton } from "./chat-skeleton"

const SALUDO = "¡Hola equipo! 👋"

type Sala = ReturnType<typeof useChatSala>

/** Los 4 estados del historial: loading, error, vacío accionable y lista. */
function ChatTeamBody({ sala }: { sala: Sala }) {
  if (sala.loading) return <ChatSkeleton />

  if (sala.error) {
    return (
      <div className="flex-1 p-3">
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el chat</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{sala.error}</p>
            <Button variant="outline" size="sm" onClick={() => void sala.recargar()}>
              <RotateCcw /> Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (sala.mensajes.length === 0) {
    return <ChatEmptyState enviando={sala.enviando} onSaludar={() => void sala.enviar(SALUDO)} />
  }

  return (
    <ChatMessageList
      mensajes={sala.mensajes}
      yoId={sala.yoId}
      hayMas={sala.hayMas}
      cargandoAnteriores={sala.cargandoAnteriores}
      onCargarAnteriores={() => void sala.cargarAnteriores()}
    />
  )
}

interface ChatTeamViewProps {
  proyectoId: number
}

/** Pestaña "Equipo" del panel lateral. Montarla con `key={proyectoId}` para reiniciar al cambiar de proyecto. */
export function ChatTeamView({ proyectoId }: ChatTeamViewProps) {
  const sala = useChatSala(proyectoId)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPresenceBar usuarios={sala.enSala} estado={sala.estado} />
      <ChatTeamBody sala={sala} />
      {!sala.loading && (
        <ChatInput enviando={sala.enviando} errorEnvio={sala.errorEnvio} onEnviar={sala.enviar} />
      )}
    </div>
  )
}
