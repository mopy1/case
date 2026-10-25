import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { obtenerPresencia } from "../api/chatApi"
import type { UsuarioEnSala } from "../types/chat.types"
import { useChatMensajes } from "./useChatMensajes"
import { useChatSocket } from "./useChatSocket"

/** Orquesta historial + WebSocket + presencia. Único hook que consume la pestaña Equipo. */
export function useChatSala(proyectoId: number) {
  const chat = useChatMensajes(proyectoId)
  const { user } = useAuth()
  const [presentes, setPresentes] = useState<UsuarioEnSala[]>([])
  const { agregar, sincronizar, recargar, error } = chat

  const estado = useChatSocket(proyectoId, {
    onMensaje: agregar,
    onPresencia: (p) => setPresentes(p.usuarios),
    onConectado: (esReconexion) => {
      // Snapshot: el propio broadcast de presencia puede llegar antes de suscribirse.
      obtenerPresencia(proyectoId)
        .then((p) => setPresentes(p.usuarios))
        .catch(() => undefined)
      // Si el historial falló (backend caído al entrar), se recupera solo al volver el WS.
      if (error) void recargar()
      else if (esReconexion) void sincronizar()
    },
  })

  const faltoYo = estado === "conectado" && user && !presentes.some((u) => u.usuarioId === user.id)
  const enSala = faltoYo ? [...presentes, { usuarioId: user.id, username: user.username }] : presentes

  return { ...chat, estado, enSala, yoId: user?.id ?? null }
}
