import { useState } from "react"
import type { NotaRequest } from "../types/notes.type"
import { createNote } from "../api/notesApi"

export function useNoteMutations(proyectoId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (nota: NotaRequest) => {
    setLoading(true)
    setError(null)
    try {
      return await createNote(proyectoId, nota)
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
      return null
    } finally {
      setLoading(false)
    }
  }

  return { create, loading, error }
}
