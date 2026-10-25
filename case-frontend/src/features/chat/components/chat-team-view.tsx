import { useMemo, useState } from "react"
import { MessagesSquare } from "lucide-react"
import { ChatEmpty, ChatError, ChatShell, ChatSkeleton } from "@/components/chat"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { useAuth } from "@/hooks/useAuth"
import { useProject } from "@/features/projects/hooks/useProject"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import { GuiaLink } from "@/features/guia"
import type { MentionItem } from "../types/mention.types"
import { useChatSala } from "../hooks/useChatSala"
import { ChatMemoryDialog } from "./chat-memory-dialog"
import { ChatMessageList } from "./chat-message-list"
import { TeamComposer } from "./team-composer"
import { TeamHeader } from "./team-header"

const SALUDO = "¡Hola equipo!"
const CONSULTA_IA = "@SeniorDev ¿cómo estructuramos las entidades principales del proyecto?"
const menciona = (texto: string, usuario: string) => new RegExp(`@${usuario}\\b`, "i").test(texto)

/** Pestaña "Equipo": sala en tiempo real con presencia, menciones, filtro y Senior Dev. */
export function ChatTeamView({ proyectoId }: { proyectoId: number }) {
  const { user } = useAuth()
  const sala = useChatSala(proyectoId)
  const { miembros } = useProjectMembers(proyectoId)
  const { proyecto } = useProject(proyectoId)
  const [filtro, setFiltro] = useState<string | null>(null)

  const candidatos = useMemo<MentionItem[]>(
    () => [
      { id: "seniordev", username: "SeniorDev", nombreMostrar: "Senior Dev", esIa: true },
      ...miembros.map((m) => ({ id: m.usuarioId, username: m.username, nombreMostrar: m.username, esIa: false, rol: m.rol, email: m.email })),
    ],
    [miembros]
  )
  const totalMisMenciones = useMemo(
    () => (user?.username ? sala.mensajes.filter((m) => menciona(m.contenido, user.username)).length : 0),
    [sala.mensajes, user]
  )
  const mensajes = useMemo(() => {
    const objetivo = filtro === "yo" ? user?.username : filtro
    return objetivo ? sala.mensajes.filter((m) => menciona(m.contenido, objetivo)) : sala.mensajes
  }, [filtro, sala.mensajes, user])

  function cuerpo() {
    if (sala.loading) return <ChatSkeleton />
    if (sala.error) return <ChatError title="No se pudo cargar el chat" message={sala.error} onRetry={() => void sala.recargar()} />
    if (sala.mensajes.length === 0) {
      return (
        <ChatEmpty
          icon={MessagesSquare}
          title="La sala está vacía"
          description="Lo que escribas acá lo ve todo el equipo. Mencioná a @SeniorDev para pedirle una revisión."
          primaryAction={{ label: "Preguntar a Senior Dev", onClick: () => void sala.enviar(CONSULTA_IA), loading: sala.enviando }}
          secondaryAction={{ label: "Saludar al equipo", onClick: () => void sala.enviar(SALUDO), loading: sala.enviando }}
        >
          <GuiaLink seccion="general" />
        </ChatEmpty>
      )
    }
    if (mensajes.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <Marker className="w-auto">
            <MarkerContent>{filtro === "yo" ? "Nadie te mencionó todavía" : `Nadie mencionó a @${filtro} todavía`}</MarkerContent>
          </Marker>
          <Button variant="outline" size="sm" onClick={() => setFiltro(null)}>
            Ver todos los mensajes
          </Button>
        </div>
      )
    }
    return (
      <ChatMessageList
        mensajes={mensajes}
        yoId={sala.yoId}
        miUsername={user?.username}
        hayMas={sala.hayMas}
        cargandoAnteriores={sala.cargandoAnteriores}
        errorAnteriores={sala.errorAnteriores}
        onCargarAnteriores={() => void sala.cargarAnteriores()}
        iaEstado={sala.iaEstado}
        miRol={proyecto?.miRol ?? null}
        proyectoId={proyectoId}
      />
    )
  }

  return (
    <ChatShell
      header={
        <TeamHeader
          usuarios={sala.enSala}
          estado={sala.estado}
          filtro={filtro}
          onFiltroChange={setFiltro}
          totalMisMenciones={totalMisMenciones}
          totalFiltrados={mensajes.length}
          candidatos={candidatos}
          extraActions={<ChatMemoryDialog proyectoId={proyectoId} />}
        />
      }
      composer={
        !sala.loading && (
          <TeamComposer
            enviando={sala.enviando}
            errorEnvio={sala.errorEnvio}
            onEnviar={sala.enviar}
            candidatos={candidatos}
            proyectoId={proyectoId}
          />
        )
      }
    >
      {cuerpo()}
    </ChatShell>
  )
}
