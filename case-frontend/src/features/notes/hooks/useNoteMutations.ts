import { useState } from "react"
import type { NotaRequest } from "../types/notes.type"
import { createNote } from "../api/notesApi"
import { mensajeDeError } from "@/lib/api"

export function useNoteMutations(proyectoId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async (nota: NotaRequest) => {
    setLoading(true)
    setError(null)
    try {
      return await createNote(proyectoId, nota)
    } catch (err) {
      setError(mensajeDeError(err))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { create, loading, error }
}
