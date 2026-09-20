import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAttributeMutations } from "../../../hooks/useAttributeMutations"
import { AttributeFormDialog } from "./attribute-form-dialog"
import type { EntidadDiagramaResponse } from "../../../types/diagram.types"

export function EntityPropertiesPanel({
  proyectoId,
  entidad,
  entidades,
  onRename,
  onChanged,
  onClose,
}: {
  proyectoId: number
  entidad: EntidadDiagramaResponse
  entidades: EntidadDiagramaResponse[]
  onRename: (nombre: string) => Promise<boolean>
  onChanged: () => void
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(entidad.nombre)
  const { remove, loading, error } = useAttributeMutations(proyectoId, entidad.id)

  useEffect(() => {
    setNombre(entidad.nombre)
  }, [entidad.id, entidad.nombre])

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nombre.trim()
    if (!trimmed || trimmed === entidad.nombre) return
    await onRename(trimmed)
  }

  async function handleDeleteAttribute(atributoId: number) {
    await remove(atributoId)
    onChanged()
  }

  return (
    <aside className="absolute top-4 right-4 z-10 flex max-h-[calc(100vh-2rem)] w-80 flex-col gap-4 overflow-y-auto rounded-2xl border bg-card p-4 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Propiedades de la tabla</h2>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      <form onSubmit={handleRenameSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="nombreTabla">Nombre de la tabla</FieldLabel>
            <div className="flex gap-2">
              <Input id="nombreTabla" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              <Button type="submit" size="sm" variant="outline" disabled={nombre.trim() === entidad.nombre}>
                Guardar
              </Button>
            </div>
          </Field>
        </FieldGroup>
      </form>

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Atributos</h3>
        <AttributeFormDialog
          trigger={<Button variant="ghost" size="icon-xs" />}
          proyectoId={proyectoId}
          entidad={entidad}
          entidades={entidades}
          onSaved={onChanged}
        >
          <Plus className="size-3.5" />
        </AttributeFormDialog>
      </div>

      {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}

      <div className="flex flex-col gap-2">
        {entidad.atributos.length === 0 && <p className="text-xs text-muted-foreground">Sin atributos todavía.</p>}
        {entidad.atributos.map((atributo) => (
          <div key={atributo.id} className="flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-xs">
              {atributo.esPk && (
                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                  PK
                </Badge>
              )}
              {atributo.esFk && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  FK
                </Badge>
              )}
              <span className="truncate font-medium">{atributo.nombre}</span>
              <span className="font-mono text-muted-foreground">{atributo.tipoSql}</span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <AttributeFormDialog
                trigger={<Button variant="ghost" size="icon-xs" />}
                proyectoId={proyectoId}
                entidad={entidad}
                entidades={entidades}
                atributo={atributo}
                onSaved={onChanged}
              >
                <Pencil className="size-3" />
              </AttributeFormDialog>
              <ConfirmDialog
                trigger={<Button variant="ghost" size="icon-xs" disabled={loading} />}
                title="¿Eliminar este atributo?"
                description={`Se va a borrar "${atributo.nombre}" de "${entidad.nombre}".`}
                confirmLabel="Eliminar atributo"
                onConfirm={() => handleDeleteAttribute(atributo.id)}
              >
                <Trash2 className="size-3 text-destructive" />
              </ConfirmDialog>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
