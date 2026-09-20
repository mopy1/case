import { useState } from "react"
import type { AtributoEntidadRequest } from "../types/diagram.types"
import { createAttribute, deleteAttribute, updateAttribute } from "../api/diagramApi"

export function useAttributeMutations(proyectoId: number, entidadId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      return await action()
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
      return null
    } finally {
      setLoading(false)
    }
  }

  const create = (atributo: AtributoEntidadRequest) => run(() => createAttribute(proyectoId, entidadId, atributo))
  const update = (atributoId: number, atributo: AtributoEntidadRequest) =>
    run(() => updateAttribute(proyectoId, entidadId, atributoId, atributo))
  const remove = (atributoId: number) => run(() => deleteAttribute(proyectoId, entidadId, atributoId))

  return { create, update, remove, loading, error }
}
