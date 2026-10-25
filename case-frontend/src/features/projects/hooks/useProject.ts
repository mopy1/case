import { useEffect, useState } from "react"
import type { ProyectoResponse } from "../types/projects.type"
import { getProject } from "../api/projectsApi"
import { mensajeDeError } from "@/lib/api"

export function useProject(id: number) {
  const [proyecto, setProyecto] = useState<ProyectoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    setError(null)
    getProject(id)
      .then((data) => {
        if (!cancelado) setProyecto(data)
      })
      .catch((err) => {
        if (!cancelado) setError(mensajeDeError(err))
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [id])

  return { proyecto, loading, error }
}
