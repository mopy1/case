import { useEffect, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useProjectMutations } from "../../hooks/useProjectMutations"
import type { listarProyectosResponse, ProyectoResponse } from "../../types/projects.type"

export function EditProjectDialog({
  proyecto,
  trigger,
  children,
  onUpdated,
}: {
  proyecto: listarProyectosResponse
  trigger: React.ReactElement
  children?: React.ReactNode
  onUpdated: (proyecto: ProyectoResponse) => void
}) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState(proyecto.nombre)
  const [descripcion, setDescripcion] = useState(proyecto.descripcion)
  const { updateProject, loading, error } = useProjectMutations()

  useEffect(() => {
    if (open) {
      setNombre(proyecto.nombre)
      setDescripcion(proyecto.descripcion)
    }
  }, [open, proyecto.nombre, proyecto.descripcion])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const actualizado = await updateProject(proyecto.id, { nombre: nombre.trim(), descripcion: descripcion.trim() })
    if (actualizado) {
      onUpdated(actualizado)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger}>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>Actualizá el nombre y la descripción de este proyecto.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-nombre">Nombre</FieldLabel>
              <Input
                id="edit-nombre"
                placeholder="Sistema de Veterinaria"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-descripcion">Descripción</FieldLabel>
              <Textarea
                id="edit-descripcion"
                placeholder="Modelo de dueños, mascotas y citas médicas"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Field>
            {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
