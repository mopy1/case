import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { colorAvatar, iniciales } from "@/lib/avatar"
import type { MiembroProyectoResponse, RolProyecto } from "../../types/projects.type"
import { ROLES } from "./project-members-dialog.data"

interface MemberItemProps {
  miembro: MiembroProyectoResponse
  esAdmin: boolean
  loading: boolean
  onChangeRole: (usuarioObjetivoId: number, rol: RolProyecto) => void
  onRemove: (usuarioObjetivoId: number) => void
}

export function MemberItem({ miembro, esAdmin, loading, onChangeRole, onRemove }: MemberItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border px-3 py-2">
      <Avatar size="sm">
        <AvatarFallback className={colorAvatar(miembro.usuarioId)}>{iniciales(miembro.username)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{miembro.username}</p>
        <p className="truncate text-xs text-muted-foreground">{miembro.email}</p>
      </div>
      {esAdmin ? (
        <>
          <Select
            items={ROLES}
            value={miembro.rol}
            onValueChange={(v) => onChangeRole(miembro.usuarioId, v as RolProyecto)}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ConfirmDialog
            trigger={<Button type="button" variant="ghost" size="icon" disabled={loading} />}
            title="¿Quitar a este colaborador?"
            description={`${miembro.username} va a perder acceso al proyecto.`}
            confirmLabel="Quitar"
            onConfirm={() => onRemove(miembro.usuarioId)}
          >
            <Trash2 className="size-4 text-destructive" />
          </ConfirmDialog>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">{miembro.rol}</span>
      )}
    </div>
  )
}
