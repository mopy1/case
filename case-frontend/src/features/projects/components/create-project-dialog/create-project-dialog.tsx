import { Plus } from "lucide-react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useProjectMutations } from "../../hooks/useProjectMutations"
import type { ProyectoResponse } from "../../types/projects.type"

export function CreateProjectDialog({ onCreated }: { onCreated: (proyecto: ProyectoResponse) => void }) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const { createProject, loading, error } = useProjectMutations()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const proyecto = await createProject({ nombre: nombre.trim(), descripcion: descripcion.trim() })
    if (proyecto) {
      onCreated(proyecto)
      setNombre("")
      setDescripcion("")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Card className="flex h-full min-h-[160px] cursor-pointer items-center justify-center border-dashed text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground active:border-primary active:bg-primary/10 sm:min-h-[200px]" />
        }
      >
        <CardContent className="flex flex-col items-center gap-3">
          <span className={cn(buttonVariants({ variant: "outline", size: "icon-lg" }), "pointer-events-none")}>
            <Plus className="size-4" />
          </span>
          <span>Crear proyecto nuevo</span>
        </CardContent>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Un proyecto es un modelo de base de datos en el que podés colaborar con otras personas.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
              <Input
                id="nombre"
                placeholder="Sistema de Veterinaria"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
              <Textarea
                id="descripcion"
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
              {loading ? "Creando..." : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
