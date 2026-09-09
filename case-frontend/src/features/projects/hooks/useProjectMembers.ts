import { useEffect, useState } from "react"
import type { MiembroProyectoResponse } from "../types/projects.type"
import { miembrosProject } from "../api/projectsApi"

export function useProjectMembers(proyectoId: number) {
  const [miembros, setMiembros] = useState<MiembroProyectoResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    miembrosProject(proyectoId)
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

  return { miembros, loading }
}
