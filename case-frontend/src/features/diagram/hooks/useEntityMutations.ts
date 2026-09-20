import { useState } from "react"
import type { EntidadDiagramaRequest } from "../types/diagram.types"
import { createEntity, deleteEntity, updateEntity } from "../api/diagramApi"

export function useEntityMutations(proyectoId: number) {
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

  const create = (entidad: EntidadDiagramaRequest) => run(() => createEntity(proyectoId, entidad))
  const update = (entidadId: number, entidad: EntidadDiagramaRequest) =>
    run(() => updateEntity(proyectoId, entidadId, entidad))
  const remove = (entidadId: number) => run(() => deleteEntity(proyectoId, entidadId))

  return { create, update, remove, loading, error }
}
