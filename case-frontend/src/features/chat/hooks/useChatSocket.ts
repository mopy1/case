import { useEffect, useRef, useState } from "react"
import { Client } from "@stomp/stompjs"
import { chatTopics, chatWsUrl } from "../lib/chatSocket"
import type { ChatMensaje, ChatPresencia, EstadoConexionChat } from "../types/chat.types"

interface ChatSocketHandlers {
  onMensaje(m: ChatMensaje): void
  onPresencia(p: ChatPresencia): void
  onConectado(esReconexion: boolean): void
}

/** Ciclo de vida del cliente STOMP de la sala. 401/403 del servidor → "error" sin reintentar en bucle. */
export function useChatSocket(proyectoId: number, handlers: ChatSocketHandlers): EstadoConexionChat {
  const [estado, setEstado] = useState<EstadoConexionChat>("conectando")
  const handlersRef = useRef(handlers)

  // Siempre los handlers del último render, sin reconectar cuando cambian.
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!proyectoId) return
    const topics = chatTopics(proyectoId)
    let detenido = false
    let yaConectado = false

    const detener = () => {
      detenido = true
      setEstado("error")
      void client.deactivate()
    }

    const client = new Client({
      brokerURL: chatWsUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })

    // En cada (re)intento usa el token vigente de localStorage.
    client.beforeConnect = () => {
      const token = localStorage.getItem("token")
      if (!token) return detener()
      client.connectHeaders = { Authorization: `Bearer ${token}` }
    }

    client.onConnect = () => {
      client.subscribe(topics.mensajes, (f) => handlersRef.current.onMensaje(JSON.parse(f.body)))
      client.subscribe(topics.presencia, (f) => handlersRef.current.onPresencia(JSON.parse(f.body)))
      setEstado("conectado")
      handlersRef.current.onConectado(yaConectado)
      yaConectado = true
    }

    client.onWebSocketClose = () => {
      if (!detenido) setEstado("reconectando")
    }

    client.onStompError = (frame) => {
      const motivo = frame.headers.message ?? ""
      if (motivo.includes("401") || motivo.includes("403")) detener()
    }

    client.activate()
    return () => {
      detenido = true
      void client.deactivate()
    }
  }, [proyectoId])

  return estado
}
