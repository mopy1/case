import { useState } from "react"
import { Plus } from "lucide-react"
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

export function CanvasToolbar({
  onCreate,
  loading,
  error,
}: {
  onCreate: (nombre: string) => Promise<boolean>
  loading: boolean
  error: string | null
}) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await onCreate(nombre.trim())
    if (ok) {
      setNombre("")
      setOpen(false)
    }
  }

  return (
    <div className="absolute top-4 left-4 z-10">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" />
          Entidad
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>Nueva tabla</DialogTitle>
              <DialogDescription>Le podés agregar atributos y relaciones más adelante.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nombreEntidad">Nombre de la tabla</FieldLabel>
                <Input
                  id="nombreEntidad"
                  placeholder="cliente"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </Field>
              {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear tabla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
