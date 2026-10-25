import { useCallback, useEffect, useState } from "react"
import { mensajeDeError } from "@/lib/api"
import { enviarMensaje, listarMensajes } from "../api/chatApi"
import { unirMensajes } from "../lib/chatFormat"
import { CHAT_LIMITE_PAGINA, type ChatMensaje } from "../types/chat.types"

/** Historial paginado del chat + envío por REST. Se asume montado con `key={proyectoId}`. */
export function useChatMensajes(proyectoId: number) {
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hayMas, setHayMas] = useState(false)
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const aplicarUltimos = useCallback((lista: ChatMensaje[]) => {
    setMensajes(lista)
    setHayMas(lista.length === CHAT_LIMITE_PAGINA)
    setError(null)
  }, [])

  useEffect(() => {
    if (!proyectoId) return
    let vigente = true
    listarMensajes(proyectoId)
      .then((lista) => vigente && aplicarUltimos(lista))
      .catch((err) => vigente && setError(mensajeDeError(err)))
      .finally(() => vigente && setLoading(false))
    return () => {
      vigente = false
    }
  }, [proyectoId, aplicarUltimos])

  const recargar = useCallback(async () => {
    setLoading(true)
    try {
      aplicarUltimos(await listarMensajes(proyectoId))
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setLoading(false)
    }
  }, [proyectoId, aplicarUltimos])

  /** Tras una reconexión: trae los últimos y los une con lo que ya hay (recupera lo perdido). */
  const sincronizar = useCallback(async () => {
    try {
      const lista = await listarMensajes(proyectoId)
      setMensajes((prev) => unirMensajes(prev, lista))
    } catch {
      // Silencioso: el historial visible sigue siendo válido y la próxima reconexión reintenta.
    }
  }, [proyectoId])

  const primerId = mensajes[0]?.id
  const cargarAnteriores = useCallback(async () => {
    if (!primerId) return
    setCargandoAnteriores(true)
    try {
      const lista = await listarMensajes(proyectoId, primerId)
      setMensajes((prev) => unirMensajes(prev, lista))
      setHayMas(lista.length === CHAT_LIMITE_PAGINA)
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargandoAnteriores(false)
    }
  }, [proyectoId, primerId])

  const agregar = useCallback((m: ChatMensaje) => {
    setMensajes((prev) => unirMensajes(prev, [m]))
  }, [])

  const enviar = useCallback(
    async (contenido: string) => {
      setEnviando(true)
      setErrorEnvio(null)
      try {
        agregar(await enviarMensaje(proyectoId, contenido))
        return true
      } catch (err) {
        setErrorEnvio(mensajeDeError(err, "No se pudo enviar el mensaje"))
        return false
      } finally {
        setEnviando(false)
      }
    },
    [proyectoId, agregar]
  )

  return {
    mensajes, loading, error, hayMas, cargandoAnteriores, enviando, errorEnvio,
    recargar, sincronizar, cargarAnteriores, enviar, agregar,
  }
}
