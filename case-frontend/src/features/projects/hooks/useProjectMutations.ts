import { useState } from "react"
import type { ProyectoRequest } from "../types/projects.type"
import {
  createProject as createProjectRequest,
  updateProject as updateProjectRequest,
  deleteProject as deleteProjectRequest,
} from "../api/projectsApi"

export function useProjectMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProject = async (proyecto: ProyectoRequest) => {
    setLoading(true)
    setError(null)
    try {
      return await createProjectRequest(proyecto)
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (id: number, proyecto: ProyectoRequest) => {
    setLoading(true)
    setError(null)
    try {
      return await updateProjectRequest(id, proyecto)
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await deleteProjectRequest(id)
      return true
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
      return false
    } finally {
      setLoading(false)
    }
  }

  return { createProject, updateProject, deleteProject, loading, error }
}
