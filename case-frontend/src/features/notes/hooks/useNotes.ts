import { useCallback, useEffect, useState } from "react"
import type { NotaResponse } from "../types/notes.type"
import { getNotes } from "../api/notesApi"
import { mensajeDeError } from "@/lib/api"

export function useNotes(proyectoId: number) {
  const [notas, setNotas] = useState<NotaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    getNotes(proyectoId)
      .then(setNotas)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setLoading(false))
  }, [proyectoId])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    const handleNoteCreated = (e: Event) => {
      const customEvent = e as CustomEvent<{ proyectoId: number; nota?: NotaResponse }>
      if (customEvent.detail?.proyectoId === proyectoId) {
        if (customEvent.detail.nota) {
          setNotas((prev) => {
            if (prev.some((n) => n.id === customEvent.detail.nota!.id)) {
              return prev
            }
            return [customEvent.detail.nota!, ...prev]
          })
        } else {
          refetch()
        }
      }
    }

    window.addEventListener("project:note-created", handleNoteCreated)
    return () => window.removeEventListener("project:note-created", handleNoteCreated)
  }, [proyectoId, refetch])

  return { notas, loading, error, refetch }
}

