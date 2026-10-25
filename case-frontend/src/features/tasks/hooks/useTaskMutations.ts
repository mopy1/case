import { useState } from "react"
import type { CambiarEstadoRequest, TareaRequest } from "../types/tasks.type"
import { changeTaskStatus, createTask, deleteTask } from "../api/tasksApi"
import { mensajeDeError } from "@/lib/api"

export function useTaskMutations(proyectoId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function withLoading<T>(fn: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(mensajeDeError(err))
      return null
    } finally {
      setLoading(false)
    }
  }

  const create = async (tarea: TareaRequest) => {
    const result = await withLoading(() => createTask(proyectoId, tarea))
    if (result) {
      window.dispatchEvent(new CustomEvent("project:task-created", { detail: { proyectoId, task: result } }))
    }
    return result
  }

  const changeStatus = async (tareaId: number, request: CambiarEstadoRequest) => {
    const result = await withLoading(() => changeTaskStatus(proyectoId, tareaId, request))
    if (result) {
      window.dispatchEvent(new CustomEvent("project:task-updated", { detail: { proyectoId, task: result } }))
    }
    return result
  }

  const remove = async (taskId: number) => {
    let success = false
    const result = await withLoading(async () => {
      await deleteTask(proyectoId, taskId)
      success = true
    })
    if (success) {
      window.dispatchEvent(new CustomEvent("project:task-deleted", { detail: { proyectoId, taskId } }))
    }
    return result
  }

  return { create, changeStatus, remove, loading, error }
}
