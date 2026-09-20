import { useCallback, useEffect, useState } from "react"
import type { MiembroProyectoResponse } from "../types/projects.type"
import { getProjectMembers } from "../api/projectsApi"

export function useProjectMembers(proyectoId: number) {
  const [miembros, setMiembros] = useState<MiembroProyectoResponse[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    return getProjectMembers(proyectoId)
      .then((data) => setMiembros(data))
      .catch(() => setMiembros([]))
      .finally(() => setLoading(false))
  }, [proyectoId])

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    getProjectMembers(proyectoId)
      .then((data) => {
        if (!cancelado) setMiembros(data)
      })
      .catch(() => {
        if (!cancelado) setMiembros([])
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [proyectoId])

  return { miembros, loading, refetch }
}
