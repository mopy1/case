import { useEffect, useState } from "react"
import type { NotaResponse } from "../types/notes.type"
import { getNotes } from "../api/notesApi"

export function useNotes(proyectoId: number) {
  const [notas, setNotas] = useState<NotaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = () => {
    setLoading(true)
    setError(null)
    getNotes(proyectoId)
      .then(setNotas)
      .catch((err) => setError(err.message || "No se pudo conectar con el servidor"))
      .finally(() => setLoading(false))
  }

  useEffect(refetch, [proyectoId])

  return { notas, loading, error, refetch }
}
