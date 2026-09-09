import { useState } from "react"
import type { CambiarEstadoRequest, TareaRequest } from "../types/tasks.type"
import { changeTaskStatus, createTask, deleteTask } from "../api/tasksApi"

export function useTaskMutations(proyectoId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function withLoading<T>(fn: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
      return null
    } finally {
      setLoading(false)
    }
  }

  const create = (tarea: TareaRequest) => withLoading(() => createTask(proyectoId, tarea))
  const changeStatus = (tareaId: number, request: CambiarEstadoRequest) =>
    withLoading(() => changeTaskStatus(proyectoId, tareaId, request))
  const remove = (tareaId: number) => withLoading(() => deleteTask(proyectoId, tareaId))

  return { create, changeStatus, remove, loading, error }
}
