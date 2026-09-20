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
import { Textarea } from "@/components/ui/textarea"
import { useNoteMutations } from "../../hooks/useNoteMutations"
import type { NotaResponse } from "../../types/notes.type"

export function CreateNoteDialog({
  proyectoId,
  onCreated,
}: {
  proyectoId: number
  onCreated: (nota: NotaResponse) => void
}) {
  const [open, setOpen] = useState(false)
  const [accion, setAccion] = useState("")
  const [motivo, setMotivo] = useState("")
  const { create, loading, error } = useNoteMutations(proyectoId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nota = await create({ accion: accion.trim(), motivo: motivo.trim() })
    if (nota) {
      onCreated(nota)
      setAccion("")
      setMotivo("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Nueva nota</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Nueva nota</DialogTitle>
            <DialogDescription>Dejá registrado el por qué de un cambio, para que el equipo lo entienda después.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="accion">Qué se hizo</FieldLabel>
              <Input
                id="accion"
                placeholder="Crear tabla Cliente"
                value={accion}
                onChange={(e) => setAccion(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="motivo">Por qué</FieldLabel>
              <Textarea
                id="motivo"
                placeholder="El enunciado pide separar dueño y mascota"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </Field>
            {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar nota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
