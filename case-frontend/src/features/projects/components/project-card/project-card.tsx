import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { useProjectMembers } from "../../hooks/useProjectMembers"
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

export function ProjectCard({ proyecto }: { proyecto: listarProyectosResponse }) {
  const { miembros } = useProjectMembers(proyecto.id)
  const visibles = miembros.slice(0, MAX_AVATARES)
  const restantes = miembros.length - visibles.length

  return (
    <Link to={`/proyectos/${proyecto.id}`} className="block h-full">
      <Card className="h-full min-h-[160px] justify-between border transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg active:border-primary active:bg-primary/10 sm:min-h-[200px]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="truncate">{proyecto.nombre}</CardTitle>
            <Badge variant={ROL_BADGE_VARIANT[proyecto.miRol]}>{proyecto.miRol}</Badge>
          </div>
          <CardDescription>{proyecto.descripcion}</CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-between">
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
    </Link>
  )
}
