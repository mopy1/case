import { ArrowLeft } from "lucide-react"
import { Link, NavLink } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarGroupCount } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UserAvatarMenu } from "@/components/common/UserAvatarMenu"
import { ThemeToggle } from "@/components/common/ThemeToggle"
import { cn } from "@/lib/utils"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { useAuth } from "@/hooks/useAuth"
import { ProjectMembersDialog } from "@/features/projects/components/project-members-dialog"
import type { MiembroProyectoResponse, RolProyecto } from "@/features/projects/types/projects.type"
import { decodeProjectId } from "@/lib/projectCode"
import { projectNavItems } from "./project-nav-rail.data"

const MAX_AVATARES_RAIL = 4

export function ProjectNavRail({
  projectId,
  miembros,
  miRol,
}: {
  projectId: string
  miembros: MiembroProyectoResponse[]
  miRol?: RolProyecto
}) {
  const { user } = useAuth()
  const otros = miembros.filter((miembro) => miembro.usuarioId !== user?.id)
  const visibles = otros.slice(0, MAX_AVATARES_RAIL)
  const restantes = otros.length - visibles.length

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center justify-between border-r py-4">
      <div className="flex flex-col items-center gap-2">
        <Tooltip>
          <TooltipTrigger render={<Link to="/proyectos" className={buttonVariants({ variant: "ghost", size: "icon" })} />}>
            <ArrowLeft className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Volver a proyectos</TooltipContent>
        </Tooltip>

        <Separator className="w-8" />

        {projectNavItems.map((item) => (
          <Tooltip key={item.path}>
            <TooltipTrigger
              render={
                item.disabled ? (
                  <span className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "cursor-not-allowed opacity-40")} />
                ) : (
                  <NavLink
                    to={`/proyectos/${projectId}/${item.path}`}
                    className={({ isActive }) => cn(buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "icon" }))}
                  />
                )
              }
            >
              <item.icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">{item.disabled ? `${item.label} (próximamente)` : item.label}</TooltipContent>
          </Tooltip>
        ))}

        {miRol && (
          <>
            <Separator className="w-8" />
            <ProjectMembersDialog proyectoId={decodeProjectId(projectId)} miRol={miRol} />
          </>
        )}
      </div>

      <div className="flex flex-col items-center">
        {visibles.length > 0 && (
          <>
            <Separator className="mb-3 w-8" />
            <div className="flex flex-col items-center -space-y-2">
              {visibles.map((miembro) => (
                <Tooltip key={miembro.id}>
                  <TooltipTrigger render={<span className="block" />}>
                    <Avatar size="sm" className="ring-2 ring-background">
                      <AvatarFallback className={colorAvatar(miembro.usuarioId)}>
                        {iniciales(miembro.username)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {miembro.username} · {miembro.rol}
                  </TooltipContent>
                </Tooltip>
              ))}
              {restantes > 0 && (
                <AvatarGroupCount className="size-6 text-xs ring-2 ring-background">+{restantes}</AvatarGroupCount>
              )}
            </div>
          </>
        )}

        {user && (
          <>
            <Separator className="mt-3 mb-2 w-8" />
            <ThemeToggle tooltipSide="right" className="mb-2 size-8" />
            <UserAvatarMenu side="right" align="end" />
          </>
        )}
      </div>
    </nav>
  )
}
