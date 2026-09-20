import { useState } from "react"
import type { PuntoControl, RelacionDiagramaRequest } from "../types/diagram.types"
import { createRelation, deleteRelation, updateRelation, updateRelationPuntosControl } from "../api/diagramApi"

export function useRelationMutations(proyectoId: number) {
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

  const create = (relacion: RelacionDiagramaRequest) => run(() => createRelation(proyectoId, relacion))
  const update = (relacionId: number, relacion: RelacionDiagramaRequest) =>
    run(() => updateRelation(proyectoId, relacionId, relacion))
  const remove = (relacionId: number) => run(() => deleteRelation(proyectoId, relacionId))
  const updatePuntosControl = (relacionId: number, puntos: PuntoControl[]) =>
    run(() => updateRelationPuntosControl(proyectoId, relacionId, puntos))

  return { create, update, remove, updatePuntosControl, loading, error }
}
