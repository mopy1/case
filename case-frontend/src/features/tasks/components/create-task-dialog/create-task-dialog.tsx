import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { useProjectMembers } from "@/features/projects/hooks/useProjectMembers"
import { useTaskMutations } from "../../hooks/useTaskMutations"
import type { Prioridad, TareaResponse } from "../../types/tasks.type"

const PRIORIDADES: { value: Prioridad; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
]

export function CreateTaskDialog({
  proyectoId,
  onCreated,
}: {
  proyectoId: number
  onCreated: (tarea: TareaResponse) => void
}) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState<Prioridad>("MEDIA")
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const { miembros } = useProjectMembers(proyectoId)
  const { create, loading, error } = useTaskMutations(proyectoId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const tarea = await create({
      titulo,
      descripcion,
      prioridad,
      usuarioId: usuarioId ? Number(usuarioId) : null,
    })
    if (tarea) {
      onCreated(tarea)
      setTitulo("")
      setDescripcion("")
      setPrioridad("MEDIA")
      setUsuarioId(null)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nueva tarea</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva tarea</DialogTitle>
            <DialogDescription>Se crea en estado "Pendiente".</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="titulo">Título</FieldLabel>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
              <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Prioridad</FieldLabel>
              <Select items={PRIORIDADES} value={prioridad} onValueChange={(v) => setPrioridad(v as Prioridad)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Asignar a</FieldLabel>
              <Select
                items={[
                  { label: "Sin asignar", value: null },
                  ...miembros.map((m) => ({ label: m.username, value: String(m.usuarioId) })),
                ]}
                value={usuarioId}
                onValueChange={(v) => setUsuarioId(v as string | null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={null}>Sin asignar</SelectItem>
                    {miembros.map((miembro) => (
                      <SelectItem key={miembro.id} value={String(miembro.usuarioId)}>
                        {miembro.username}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
