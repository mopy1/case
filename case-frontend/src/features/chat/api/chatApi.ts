import { apiFetch } from "@/lib/api"
import {
  CHAT_LIMITE_PAGINA,
  type ChatMensaje,
  type ChatPresencia,
  type EnviarMensajeRequest,
} from "../types/chat.types"

const base = (proyectoId: number) => `/api/proyectos/${proyectoId}/chat`

/** Últimos `limite` mensajes (o los anteriores a `antesDe`), en orden cronológico ascendente. 
 * 
 *
 * asdf
 * */
export function listarMensajes(proyectoId: number, antesDe?: number, limite = CHAT_LIMITE_PAGINA) {
  const query = new URLSearchParams({ limite: String(limite) })
  if (antesDe) query.set("antesDe", String(antesDe))
  return apiFetch<ChatMensaje[]>(`${base(proyectoId)}/mensajes?${query}`, {
    errorFallback: "No se pudo cargar el chat del equipo",
  })
}

export function enviarMensaje(proyectoId: number, contenido: string) {
  const body: EnviarMensajeRequest = { contenido }
  return apiFetch<ChatMensaje>(`${base(proyectoId)}/mensajes`, {
    method: "POST",
    body: JSON.stringify(body),
    errorFallback: "No se pudo enviar el mensaje",
  })
}

export function obtenerPresencia(proyectoId: number) {
  return apiFetch<ChatPresencia>(`${base(proyectoId)}/presencia`, {
    errorFallback: "No se pudo obtener quién está en la sala",
  })
}

export async function marcarPropuestaAplicada(
  proyectoId: number,
  mensajeId: number
): Promise<ChatMensaje> {
  return apiFetch<ChatMensaje>(`${base(proyectoId)}/mensajes/${mensajeId}/aplicar`, {
    method: "POST",
    errorFallback: "No se pudo sincronizar el estado de la propuesta",
  })
}
