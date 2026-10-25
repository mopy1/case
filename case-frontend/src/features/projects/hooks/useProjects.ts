import { useState, useEffect } from "react"
import type { listarProyectosResponse } from "../types/projects.type"
import { getMyProjects as getMyProjectsRequest } from "../api/projectsApi"
import { mensajeDeError } from "@/lib/api"

export function useProjects() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<listarProyectosResponse[]>([])

  const getMyProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyProjectsRequest()
      setProjects(data)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getMyProjects()
  }, [])

  return { getMyProjects, loading, error, projects }
}
