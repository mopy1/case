import { useState } from "react"
import type { ProyectoRequest } from "../types/projects.type"
import { createProject as createProjectRequest } from "../api/projectsApi"

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

  return { createProject, loading, error }
}
