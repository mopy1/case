import { useEffect, useState } from "react"
import { Outlet, useParams } from "react-router-dom"
import { Bot } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProjectNavRail } from "@/components/common/project-nav-rail"
import { useProject } from "@/features/projects/hooks/useProject"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import { CopilotPanel } from "@/features/copilot"

const COPILOT_STORAGE_KEY = "sw_case_copilot_open"

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = Number(id)
  const { proyecto, error } = useProject(proyectoId)
  const { miembros } = useProjectMembers(proyectoId)

  const [isCopilotOpen, setIsCopilotOpen] = useState(() => {
    const saved = localStorage.getItem(COPILOT_STORAGE_KEY)
    // Por defecto ABIERTO para que el usuario lo vea inmediatamente al entrar al proyecto
    return saved !== null ? saved === "true" : true
  })

  useEffect(() => {
    localStorage.setItem(COPILOT_STORAGE_KEY, String(isCopilotOpen))
  }, [isCopilotOpen])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ProjectNavRail
        projectId={id!}
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
            className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-xl border border-border bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-md backdrop-blur hover:bg-muted hover:border-primary transition-all cursor-pointer"
            aria-label="Abrir Asistente Copilot IA"
          >
            <Bot className="size-4 text-primary" />
            <span>Copilot IA</span>
          </button>
        )}
      </main>

      <CopilotPanel
        proyectoId={proyectoId}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  )
}
