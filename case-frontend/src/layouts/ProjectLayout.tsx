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
    <div className="flex min-h-screen">
      <ProjectNavRail
        projectId={id!}
        miembros={miembros}
        miRol={proyecto?.miRol}
        isCopilotOpen={isCopilotOpen}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
      />
      <main className="flex-1 min-w-0 overflow-x-auto">
        {error ? (
          <Alert variant="destructive" className="m-6">
            <AlertTitle>No se pudo cargar el proyecto</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Outlet />
        )}
      </main>
      <CopilotPanel
        proyectoId={proyectoId}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Botón flotante accesible cuando el panel esté colapsado */}
      {!isCopilotOpen && (
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2.5 text-sm font-medium text-foreground shadow-2xl backdrop-blur hover:bg-muted hover:border-primary transition-all cursor-pointer"
          aria-label="Abrir Asistente Copilot IA"
        >
          <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="size-3.5" />
          </div>
          <span>Copilot IA</span>
        </button>
      )}
    </div>
  )
}
