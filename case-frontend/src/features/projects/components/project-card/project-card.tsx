import { Link } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { encodeProjectId } from "@/lib/projectCode"
import { useProjectMembers } from "../../hooks/useProjectMembers"
import { useProjectMutations } from "../../hooks/useProjectMutations"
import { EditProjectDialog } from "../edit-project-dialog/edit-project-dialog"
import type { listarProyectosResponse, RolProyecto } from "../../types/projects.type"

const ROL_BADGE_VARIANT: Record<RolProyecto, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  COLABORADOR: "secondary",
  LECTOR: "outline",
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const MAX_AVATARES = 4

export function ProjectCard({
  proyecto,
  onChanged,
}: {
  proyecto: listarProyectosResponse
  onChanged: () => void
}) {
  const { miembros } = useProjectMembers(proyecto.id)
  const { deleteProject } = useProjectMutations()
  const visibles = miembros.slice(0, MAX_AVATARES)
  const restantes = miembros.length - visibles.length
  const esAdmin = proyecto.miRol === "ADMIN"

  async function handleDelete() {
    const ok = await deleteProject(proyecto.id)
    if (ok) onChanged()
  }

  return (
    <Card className="relative h-full min-h-[160px] justify-between border transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg active:border-primary active:bg-primary/10 sm:min-h-[200px]">
      <Link
        to={`/proyectos/${encodeProjectId(proyecto.id)}`}
        className="absolute inset-0 z-0"
        aria-label={`Abrir proyecto ${proyecto.nombre}`}
      />
      <CardHeader className="pointer-events-none relative z-10">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="truncate">{proyecto.nombre}</CardTitle>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1">
            <Badge variant={ROL_BADGE_VARIANT[proyecto.miRol]}>{proyecto.miRol}</Badge>
            {esAdmin && (
              <>
                <EditProjectDialog
                  proyecto={proyecto}
                  onUpdated={onChanged}
                  trigger={<Button type="button" variant="ghost" size="icon-sm" aria-label="Editar proyecto" />}
                >
                  <Pencil className="size-3.5" />
                </EditProjectDialog>
                <ConfirmDialog
                  trigger={<Button type="button" variant="ghost" size="icon-sm" aria-label="Eliminar proyecto" />}
                  title="¿Eliminar este proyecto?"
                  description={`Se va a eliminar "${proyecto.nombre}" junto con su diagrama, tareas y notas. Esta acción no se puede deshacer.`}
                  confirmLabel="Eliminar"
                  onConfirm={handleDelete}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </ConfirmDialog>
              </>
            )}
          </div>
        </div>
        <CardDescription>{proyecto.descripcion}</CardDescription>
      </CardHeader>
      <CardFooter className="pointer-events-none relative z-10 flex items-center justify-between">
        <AvatarGroup>
          {visibles.map((miembro) => (
            <Avatar key={miembro.id} size="sm">
              <AvatarFallback className={colorAvatar(miembro.usuarioId)}>
                {iniciales(miembro.username)}
              </AvatarFallback>
            </Avatar>
          ))}
          {restantes > 0 && <AvatarGroupCount className="size-6 text-xs">+{restantes}</AvatarGroupCount>}
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">{formatFecha(proyecto.createdAt)}</span>
      </CardFooter>
    </Card>
  )
}
