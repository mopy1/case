import { useMemo, useState } from "react"
import { RotateCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useProject } from "@/features/projects/hooks/useProject"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import type { MentionItem } from "../types/mention.types"
import type { ChatMensaje } from "../types/chat.types"
import { useChatSala } from "../hooks/useChatSala"
import { ChatEmptyState } from "./chat-empty-state"
import { ChatInput } from "./chat-input"
import { ChatMentionsFilter } from "./chat-mentions-filter"
import { ChatMessageList } from "./chat-message-list"
import { ChatPresenceBar } from "./chat-presence-bar"
import { ChatSkeleton } from "./chat-skeleton"

const SALUDO = "¡Hola equipo! 👋"
const CONSULTA_IA = "@SeniorDev ¿cómo estructuramos las entidades principales del proyecto?"
type Sala = ReturnType<typeof useChatSala>

interface ChatTeamBodyProps {
  sala: Sala
  mensajes: ChatMensaje[]
  miRol?: RolProyecto | null
  proyectoId: number
  onLimpiarFiltro: () => void
}

function ChatTeamBody({ sala, mensajes, miRol, proyectoId, onLimpiarFiltro }: ChatTeamBodyProps) {
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
    return <ChatEmptyState enviando={sala.enviando} onSaludar={() => void sala.enviar(SALUDO)} onConsultarIa={() => void sala.enviar(CONSULTA_IA)} />
  }
  if (mensajes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-xs text-muted-foreground">No hay mensajes con la mención seleccionada.</p>
        <Button variant="outline" size="sm" onClick={onLimpiarFiltro}>Ver todos los mensajes</Button>
      </div>
    )
  }
  return (
    <ChatMessageList
      mensajes={mensajes}
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

/** Pestaña "Equipo" del panel lateral con presencia, menciones y filtro. */
export function ChatTeamView({ proyectoId }: { proyectoId: number }) {
  const { user } = useAuth()
  const sala = useChatSala(proyectoId)
  const { miembros } = useProjectMembers(proyectoId)
  const { proyecto } = useProject(proyectoId)
  const [filtro, setFiltro] = useState<string | null>(null)

  const candidatos = useMemo<MentionItem[]>(() => {
    const lista: MentionItem[] = [{ id: "seniordev", username: "SeniorDev", nombreMostrar: "Senior Dev", esIa: true }]
    for (const m of miembros) {
      lista.push({ id: m.usuarioId, username: m.username, nombreMostrar: m.username, esIa: false, rol: m.rol, email: m.email })
    }
    return lista
  }, [miembros])

  const totalMisMenciones = useMemo(() => {
    if (!user?.username) return 0
    const re = new RegExp(`@${user.username}\\b`, "i")
    return sala.mensajes.filter((m) => re.test(m.contenido)).length
  }, [sala.mensajes, user])

  const mensajesFiltrados = useMemo(() => {
    if (!filtro) return sala.mensajes
    const target = filtro === "yo" ? user?.username : filtro
    if (!target) return sala.mensajes
    const re = new RegExp(`@${target}\\b`, "i")
    return sala.mensajes.filter((m) => re.test(m.contenido))
  }, [filtro, sala.mensajes, user])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatPresenceBar usuarios={sala.enSala} estado={sala.estado} />
      <ChatMentionsFilter filtroActivo={filtro} onCambiarFiltro={setFiltro} totalMisMenciones={totalMisMenciones} candidatos={candidatos} />
      <ChatTeamBody sala={sala} mensajes={mensajesFiltrados} miRol={proyecto?.miRol ?? null} proyectoId={proyectoId} onLimpiarFiltro={() => setFiltro(null)} />
      {!sala.loading && <ChatInput enviando={sala.enviando} errorEnvio={sala.errorEnvio} onEnviar={sala.enviar} candidatos={candidatos} />}
    </div>
  )
}
