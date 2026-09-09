import { useEffect, useState } from "react"
import type { TareaResponse } from "../types/tasks.type"
import { getTasks } from "../api/tasksApi"

export function useTasks(proyectoId: number) {
  const [tareas, setTareas] = useState<TareaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = () => {
    setLoading(true)
    setError(null)
    getTasks(proyectoId)
      .then(setTareas)
      .catch((err) => setError(err.message || "No se pudo conectar con el servidor"))
      .finally(() => setLoading(false))
  }

  useEffect(refetch, [proyectoId])

  return { tareas, loading, error, refetch }
}
