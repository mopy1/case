import { useEffect, useState } from "react"
import { useAttributeMutations } from "./useAttributeMutations"
import type { AtributoEntidadResponse } from "../types/diagram.types"

/** Estado del formulario de `AttributeFormDialog` (crear o editar un atributo — el modo lo decide la
 * presencia de `atributo`). Cada vez que se abre el diálogo se recargan los valores del atributo
 * editado, o los defaults si es uno nuevo. */
export function useAttributeForm({
  proyectoId,
  entidadId,
  atributo,
  open,
  onSaved,
}: {
  proyectoId: number
  entidadId: number
  atributo?: AtributoEntidadResponse
  open: boolean
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [tipoSql, setTipoSql] = useState("VARCHAR")
  const [esPk, setEsPk] = useState(false)
  const [esFk, setEsFk] = useState(false)
  const [referenciaEntidadId, setReferenciaEntidadId] = useState<string | null>(null)
  const [nullable, setNullable] = useState(true)
  const { create, update, loading, error } = useAttributeMutations(proyectoId, entidadId)

  useEffect(() => {
    if (!open) return
    setNombre(atributo?.nombre ?? "")
    setTipoSql(atributo?.tipoSql ?? "VARCHAR")
    setEsPk(atributo?.esPk ?? false)
    setEsFk(atributo?.esFk ?? false)
    setReferenciaEntidadId(atributo?.referenciaEntidadId ? String(atributo.referenciaEntidadId) : null)
    setNullable(atributo?.nullable ?? true)
  }, [open, atributo])

  /** Devuelve true si se guardó (el diálogo se cierra), false si falta la referencia FK o falló. */
  async function guardar(): Promise<boolean> {
    if (esFk && !referenciaEntidadId) return false
    const request = {
      nombre: nombre.trim(),
      tipoSql,
      esPk,
      esFk,
      referenciaEntidadId: esFk && referenciaEntidadId ? Number(referenciaEntidadId) : null,
      nullable,
    }
    const guardado = atributo ? await update(atributo.id, request) : await create(request)
    if (!guardado) return false
    onSaved()
    return true
  }

  function cambiarEsFk(valor: boolean) {
    setEsFk(valor)
    if (!valor) setReferenciaEntidadId(null)
  }

  return {
    campos: { nombre, tipoSql, esPk, esFk, referenciaEntidadId, nullable },
    setNombre,
    setTipoSql,
    setEsPk,
    cambiarEsFk,
    setReferenciaEntidadId,
    setNullable,
    guardar,
    loading,
    error,
  }
}
