import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useAttributeMutations } from "../../../hooks/useAttributeMutations"
import type { AtributoEntidadResponse, EntidadDiagramaResponse } from "../../../types/diagram.types"

const TIPOS_SQL = ["VARCHAR", "TEXT", "INTEGER", "BIGINT", "BOOLEAN", "DATE", "TIMESTAMP", "DECIMAL", "UUID"]
const TIPOS_SQL_ITEMS = TIPOS_SQL.map((t) => ({ value: t, label: t }))

/** Crear o editar un atributo — el modo lo decide la presencia de `atributo`. */
export function AttributeFormDialog({
  trigger,
  children,
  proyectoId,
  entidad,
  entidades,
  atributo,
  onSaved,
}: {
  trigger: React.ReactElement
  children?: React.ReactNode
  proyectoId: number
  entidad: EntidadDiagramaResponse
  entidades: EntidadDiagramaResponse[]
  atributo?: AtributoEntidadResponse
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [tipoSql, setTipoSql] = useState("VARCHAR")
  const [esPk, setEsPk] = useState(false)
  const [esFk, setEsFk] = useState(false)
  const [referenciaEntidadId, setReferenciaEntidadId] = useState<string | null>(null)
  const [nullable, setNullable] = useState(true)
  const { create, update, loading, error } = useAttributeMutations(proyectoId, entidad.id)
  const esEdicion = !!atributo
  const otrasEntidades = useMemo(
    () => entidades.filter((e) => e.id !== entidad.id),
    [entidades, entidad.id]
  )
  const otrasEntidadesItems = useMemo(
    () => otrasEntidades.map((e) => ({ value: String(e.id), label: e.nombre })),
    [otrasEntidades]
  )

  useEffect(() => {
    if (!open) return
    setNombre(atributo?.nombre ?? "")
    setTipoSql(atributo?.tipoSql ?? "VARCHAR")
    setEsPk(atributo?.esPk ?? false)
    setEsFk(atributo?.esFk ?? false)
    setReferenciaEntidadId(atributo?.referenciaEntidadId ? String(atributo.referenciaEntidadId) : null)
    setNullable(atributo?.nullable ?? true)
  }, [open, atributo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (esFk && !referenciaEntidadId) return
    const request = {
      nombre: nombre.trim(),
      tipoSql,
      esPk,
      esFk,
      referenciaEntidadId: esFk && referenciaEntidadId ? Number(referenciaEntidadId) : null,
      nullable,
    }
    const guardado = esEdicion ? await update(atributo!.id, request) : await create(request)
    if (guardado) {
      onSaved()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger}>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{esEdicion ? "Editar atributo" : "Nuevo atributo"}</DialogTitle>
            <DialogDescription>Columna de "{entidad.nombre}".</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nombreAtributo">Nombre</FieldLabel>
              <Input id="nombreAtributo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel>Tipo de dato</FieldLabel>
              <Select
                items={TIPOS_SQL_ITEMS}
                value={tipoSql}
                onValueChange={(v) => setTipoSql(v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TIPOS_SQL.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="esPk" checked={esPk} onCheckedChange={(v) => setEsPk(!!v)} />
              <FieldLabel htmlFor="esPk">Clave primaria</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="esFk"
                checked={esFk}
                onCheckedChange={(v) => {
                  setEsFk(!!v)
                  if (!v) setReferenciaEntidadId(null)
                }}
              />
              <FieldLabel htmlFor="esFk">Clave foránea</FieldLabel>
            </Field>
            {esFk && (
              <Field>
                <FieldLabel>Referencia a</FieldLabel>
                <Select
                  items={otrasEntidadesItems}
                  value={referenciaEntidadId}
                  onValueChange={(v) => setReferenciaEntidadId(v as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elegí una tabla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {otrasEntidades.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {!referenciaEntidadId && (
                  <FieldDescription className="text-destructive">Elegí a qué tabla referencia.</FieldDescription>
                )}
              </Field>
            )}
            <Field orientation="horizontal">
              <Checkbox id="nullable" checked={nullable} onCheckedChange={(v) => setNullable(!!v)} />
              <FieldLabel htmlFor="nullable">Admite nulos</FieldLabel>
            </Field>
            {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : esEdicion ? "Guardar cambios" : "Agregar atributo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
