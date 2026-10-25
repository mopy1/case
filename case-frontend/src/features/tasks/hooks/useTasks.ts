import { useCallback, useEffect, useState } from "react"
import type { TareaResponse } from "../types/tasks.type"
import { getTasks } from "../api/tasksApi"
import { mensajeDeError } from "@/lib/api"

export function useTasks(proyectoId: number) {
  const [tareas, setTareas] = useState<TareaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    getTasks(proyectoId)
      .then(setTareas)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setLoading(false))
  }, [proyectoId])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    const handleTaskCreated = (e: Event) => {
      const customEvent = e as CustomEvent<{ proyectoId: number; task?: TareaResponse }>
      if (customEvent.detail?.proyectoId === proyectoId) {
        if (customEvent.detail.task) {
          const task = customEvent.detail.task
          setTareas((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]))
        } else {
          refetch()
        }
      }
    }

    const handleTaskUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ proyectoId: number; task?: TareaResponse }>
      if (customEvent.detail?.proyectoId === proyectoId) {
        if (customEvent.detail.task) {
          const task = customEvent.detail.task
          setTareas((prev) => prev.map((t) => (t.id === task.id ? task : t)))
        } else {
          refetch()
        }
      }
    }

    const handleTaskDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ proyectoId: number; taskId?: number }>
      if (customEvent.detail?.proyectoId === proyectoId) {
        if (customEvent.detail.taskId != null) {
          const taskId = customEvent.detail.taskId
          setTareas((prev) => prev.filter((t) => t.id !== taskId))
        } else {
          refetch()
        }
      }
    }

    window.addEventListener("project:task-created", handleTaskCreated)
    window.addEventListener("project:task-updated", handleTaskUpdated)
    window.addEventListener("project:task-deleted", handleTaskDeleted)

    return () => {
      window.removeEventListener("project:task-created", handleTaskCreated)
      window.removeEventListener("project:task-updated", handleTaskUpdated)
      window.removeEventListener("project:task-deleted", handleTaskDeleted)
    }
  }, [proyectoId, refetch])

  return { tareas, loading, error, refetch }
}
