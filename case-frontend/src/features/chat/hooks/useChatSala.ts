import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { obtenerPresencia } from "../api/chatApi"
import type { ChatIaEstadoEvent, ChatMensaje, UsuarioEnSala } from "../types/chat.types"
import { useChatMensajes } from "./useChatMensajes"
import { useChatSocket } from "./useChatSocket"

const TIMEOUT_IA_MS = 65_000

/** Orquesta historial + WebSocket + presencia + estado IA. */
export function useChatSala(proyectoId: number) {
  const chat = useChatMensajes(proyectoId)
  const { user } = useAuth()
  const [presentes, setPresentes] = useState<UsuarioEnSala[]>([])
  const [iaEstado, setIaEstado] = useState<ChatIaEstadoEvent | null>(null)
  const timerIaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { agregar, sincronizar, recargar, error } = chat

  const limpiarTimerIa = useCallback(() => {
    if (timerIaRef.current) {
      clearTimeout(timerIaRef.current)
      timerIaRef.current = null
    }
  }, [])

  useEffect(() => () => limpiarTimerIa(), [limpiarTimerIa])

  const handleMensaje = useCallback((m: ChatMensaje) => {
    agregar(m)
    if (m.tipo === "IA") {
      limpiarTimerIa()
      setIaEstado(null)
    }
  }, [agregar, limpiarTimerIa])

  const handleIaEstado = useCallback((evento: ChatIaEstadoEvent) => {
    if (evento.estado === "PENSANDO") {
      setIaEstado(evento)
      limpiarTimerIa()
      timerIaRef.current = setTimeout(() => setIaEstado(null), TIMEOUT_IA_MS)
    } else {
      limpiarTimerIa()
      setIaEstado(null)
    }
  }, [limpiarTimerIa])

  const estado = useChatSocket(proyectoId, {
    onMensaje: handleMensaje,
    onPresencia: (p) => setPresentes(p.usuarios),
    onIaEstado: handleIaEstado,
    onConectado: (esReconexion) => {
      obtenerPresencia(proyectoId)
        .then((p) => setPresentes(p.usuarios))
        .catch(() => undefined)
      if (error) void recargar()
      else if (esReconexion) void sincronizar()
    },
  })

  const faltoYo = estado === "conectado" && user && !presentes.some((u) => u.usuarioId === user.id)
  const enSala = faltoYo ? [...presentes, { usuarioId: user.id, username: user.username }] : presentes

  return { ...chat, estado, enSala, yoId: user?.id ?? null, iaEstado }
}
