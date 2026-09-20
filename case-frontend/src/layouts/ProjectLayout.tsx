import { useEffect, useState } from "react"
import { Outlet, useParams } from "react-router-dom"
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
    return saved !== null ? saved === "true" : false
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
    </div>
  )
}
