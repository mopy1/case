import { useCallback, useState } from "react"
import { mensajeDeError } from "@/lib/api"
import { obtenerMemoria } from "../api/chatApi"
import type { ChatMemoria } from "../types/chat.types"

/** Memoria acumulada de la sala, cargada de forma perezosa (al abrir el diálogo) y en cada reapertura. */
export function useChatMemoria(proyectoId: number) {
  const [memoria, setMemoria] = useState<ChatMemoria | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setMemoria(await obtenerMemoria(proyectoId))
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo cargar la memoria del equipo"))
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  return { memoria, loading, error, recargar }
}
