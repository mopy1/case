import { useState } from "react"
import { Users } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useProjectMembers } from "../../hooks/useProjectMembers"
import { useMemberMutations } from "../../hooks/useMemberMutations"
import type { RolProyecto } from "../../types/projects.type"
import { ROLES } from "./project-members-dialog.data"
import { MemberItem } from "./member-item"

export function ProjectMembersDialog({ proyectoId, miRol }: { proyectoId: number; miRol: RolProyecto }) {
  const [open, setOpen] = useState(false)
  const { miembros, refetch } = useProjectMembers(proyectoId)
  const { addMember, changeRole, removeMember, loading, error } = useMemberMutations(proyectoId)
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [nuevoRol, setNuevoRol] = useState<RolProyecto>("COLABORADOR")
  const esAdmin = miRol === "ADMIN"

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const miembro = await addMember({ usernameOrEmail: usernameOrEmail.trim(), rol: nuevoRol })
    if (miembro) {
      setUsernameOrEmail("")
      setNuevoRol("COLABORADOR")
      refetch()
    }
  }

  async function handleChangeRole(usuarioObjetivoId: number, rol: RolProyecto) {
    const actualizado = await changeRole(usuarioObjetivoId, rol)
    if (actualizado) refetch()
  }

  async function handleRemove(usuarioObjetivoId: number) {
    await removeMember(usuarioObjetivoId)
    refetch()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Colaboradores"
        data-guia="nav-colaboradores"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
      >
        <Users className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Colaboradores del proyecto</DialogTitle>
          <DialogDescription>
            {esAdmin ? "Agregá personas por usuario o email y elegí su rol." : "Personas con acceso a este proyecto."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {miembros.map((miembro) => (
            <MemberItem
              key={miembro.id}
              miembro={miembro}
              esAdmin={esAdmin}
              loading={loading}
              onChangeRole={handleChangeRole}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {esAdmin && (
          <form onSubmit={handleAdd} className="flex flex-col gap-4 border-t pt-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="usernameOrEmail">Agregar colaborador</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="usernameOrEmail"
                    placeholder="usuario o usuario@ejemplo.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
                  />
                  <Select items={ROLES} value={nuevoRol} onValueChange={(v) => setNuevoRol(v as RolProyecto)}>
                    <SelectTrigger className="w-36">
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
                </div>
              </Field>
              {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cerrar</DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Agregando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
