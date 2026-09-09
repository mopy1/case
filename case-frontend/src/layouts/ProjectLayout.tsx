import { Outlet, useParams } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProjectNavRail } from "@/components/common/project-nav-rail"
import { useProject } from "@/features/projects/hooks/useProject"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = Number(id)
  const { error } = useProject(proyectoId)
  const { miembros } = useProjectMembers(proyectoId)

  return (
    <div className="flex min-h-screen">
      <ProjectNavRail projectId={id!} miembros={miembros} />
      <div className="flex-1 overflow-x-auto">
        {error ? (
          <Alert variant="destructive" className="m-6">
            <AlertTitle>No se pudo cargar el proyecto</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}
