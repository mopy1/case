import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { Bot } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProjectNavRail } from "@/components/common/project-nav-rail"
import { useProject } from "@/features/projects/hooks/useProject"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import { CopilotPanel } from "@/features/copilot"
import { usePushToTalk, VoicePushToTalkHud } from "@/features/voice"
import { useIsMobile } from "@/hooks/useIsMobile"
import { decodeProjectId, encodeProjectId } from "@/lib/projectCode"

const COPILOT_STORAGE_KEY = "sw_case_copilot_open"

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const proyectoId = decodeProjectId(id)
  const maskedCode = encodeProjectId(proyectoId)

  // Reescribir suavemente en la barra de direcciones si se ingresó con ID numérico (ej: /proyectos/1)
  useEffect(() => {
    if (id && /^\d+$/.test(id) && maskedCode && id !== maskedCode) {
      const nuevoPath = location.pathname.replace(`/proyectos/${id}`, `/proyectos/${maskedCode}`)
      navigate(nuevoPath, { replace: true })
    }
  }, [id, maskedCode, location.pathname, navigate])

  const { proyecto, error } = useProject(proyectoId)
  const { miembros } = useProjectMembers(proyectoId)
  const isMobile = useIsMobile()

  const [isCopilotOpen, setIsCopilotOpen] = useState(() => {
    // En móviles (< 768px), inicia por defecto cerrado para no ocultar el contenido principal
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return false
    }
    const saved = localStorage.getItem(COPILOT_STORAGE_KEY)
    return saved !== null ? saved === "true" : true
  })

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(COPILOT_STORAGE_KEY, String(isCopilotOpen))
    }
  }, [isCopilotOpen, isMobile])

  const handleVoiceSend = (text: string) => {
    setIsCopilotOpen(true)
    window.dispatchEvent(new CustomEvent("copilot:voice-submit", { detail: { text } }))
  }

  const { isPushing, isSending, liveText } = usePushToTalk({
    onSend: handleVoiceSend,
  })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ProjectNavRail
        projectId={maskedCode || id!}
        miembros={miembros}
        miRol={proyecto?.miRol}
      />
      <main className="relative flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
        {error ? (
          <Alert variant="destructive" className="m-6">
            <AlertTitle>No se pudo cargar el proyecto</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Outlet />
        )}

        {/* Botón arriba a la derecha cuando el panel está cerrado */}
        {!isCopilotOpen && (
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border bg-card/95 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur-xs hover:bg-muted hover:border-primary transition-all cursor-pointer"
            aria-label="Abrir Asistente Copilot IA"
          >
            <Bot className="size-3.5 sm:size-4 text-primary shrink-0" />
            <span className="text-[11px] sm:text-xs">Copilot IA</span>
          </button>
        )}
      </main>

      <CopilotPanel
        proyectoId={proyectoId}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <VoicePushToTalkHud
        isPushing={isPushing}
        isSending={isSending}
        liveText={liveText}
      />
    </div>
  )
}
