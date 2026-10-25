import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useNoteMutations, type NotaRequest } from "@/features/notes"

interface ChatSaveAdrDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: number
  /** Prellenado desde la respuesta de Senior Dev (editable). */
  borrador: NotaRequest | null
}

function Formulario({ proyectoId, borrador, onListo }: { proyectoId: number; borrador: NotaRequest; onListo: () => void }) {
  const [accion, setAccion] = useState(borrador.accion)
  const [motivo, setMotivo] = useState(borrador.motivo)
  const { create, loading, error } = useNoteMutations(proyectoId)

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const nota = await create({ accion: accion.trim(), motivo: motivo.trim() })
    if (!nota) return
    window.dispatchEvent(new CustomEvent("project:note-created", { detail: { proyectoId, nota } }))
    toast.success("Decisión guardada como ADR", { description: nota.accion })
    onListo()
  }

  return (
    <form onSubmit={(e) => void guardar(e)} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle>Guardar como ADR</DialogTitle>
        <DialogDescription>Revisá el texto antes de guardarlo: queda en Notas para todo el equipo.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="adr-accion">Decisión</FieldLabel>
          <Input id="adr-accion" maxLength={100} value={accion} onChange={(e) => setAccion(e.target.value)} required />
          <FieldDescription>{accion.length}/100</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="adr-motivo">Motivo</FieldLabel>
          <Textarea id="adr-motivo" className="max-h-64 min-h-32" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
        </Field>
        {error && <FieldDescription className="text-destructive" role="alert">{error}</FieldDescription>}
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit" disabled={loading || !accion.trim() || !motivo.trim()}>
          {loading && <Spinner data-icon="inline-start" />}
          {loading ? "Guardando…" : "Guardar ADR"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Diálogo controlado: crea una nota ADR desde un mensaje de Senior Dev reutilizando `useNoteMutations`. */
export function ChatSaveAdrDialog({ open, onOpenChange, proyectoId, borrador }: ChatSaveAdrDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {borrador && <Formulario key={borrador.motivo} proyectoId={proyectoId} borrador={borrador} onListo={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
