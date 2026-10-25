import { useMemo } from "react"
import { RotateCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useProject } from "@/features/projects/hooks/useProject"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import type { MentionItem } from "../types/mention.types"
import { useChatSala } from "../hooks/useChatSala"
import { ChatEmptyState } from "./chat-empty-state"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { ChatPresenceBar } from "./chat-presence-bar"
import { ChatSkeleton } from "./chat-skeleton"

const SALUDO = "¡Hola equipo! 👋"
const CONSULTA_INICIAL_IA = "@SeniorDev ¿cómo estructuramos las entidades principales del proyecto?"

type Sala = ReturnType<typeof useChatSala>

interface ChatTeamBodyProps {
  sala: Sala
  miRol?: RolProyecto | null
  proyectoId: number
}

/** Los 4 estados del historial: loading, error, vacío accionable y lista con eventos en tiempo real. */
function ChatTeamBody({ sala, miRol, proyectoId }: ChatTeamBodyProps) {
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
    return (
      <ChatEmptyState
        enviando={sala.enviando}
        onSaludar={() => void sala.enviar(SALUDO)}
        onConsultarIa={() => void sala.enviar(CONSULTA_INICIAL_IA)}
      />
    )
  }

  return (
    <ChatMessageList
      mensajes={sala.mensajes}
      yoId={sala.yoId}
      hayMas={sala.hayMas}
      cargandoAnteriores={sala.cargandoAnteriores}
      onCargarAnteriores={() => void sala.cargarAnteriores()}
      iaEstado={sala.iaEstado}
      miRol={miRol}
      proyectoId={proyectoId}
    />
  )
}

interface ChatTeamViewProps {
  proyectoId: number
}

/** Pestaña "Equipo" del panel lateral. Montarla con `key={proyectoId}` para reiniciar al cambiar de proyecto. */
export function ChatTeamView({ proyectoId }: ChatTeamViewProps) {
  const sala = useChatSala(proyectoId)
  const { miembros } = useProjectMembers(proyectoId)
  const { proyecto } = useProject(proyectoId)
  const miRol = proyecto?.miRol ?? null

  const candidatos = useMemo<MentionItem[]>(() => {
    const lista: MentionItem[] = [
      { id: "seniordev", username: "SeniorDev", nombreMostrar: "Senior Dev", esIa: true },
    ]
    for (const m of miembros) {
      lista.push({
        id: m.usuarioId,
        username: m.username,
        nombreMostrar: m.username,
        esIa: false,
        rol: m.rol,
        email: m.email,
      })
    }
    return lista
  }, [miembros])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPresenceBar usuarios={sala.enSala} estado={sala.estado} />
      <ChatTeamBody sala={sala} miRol={miRol} proyectoId={proyectoId} />
      {!sala.loading && (
        <ChatInput
          enviando={sala.enviando}
          errorEnvio={sala.errorEnvio}
          onEnviar={sala.enviar}
          candidatos={candidatos}
        />
      )}
    </div>
  )
}
