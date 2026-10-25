import { API_URL } from "@/lib/api"

/** URL del endpoint STOMP: misma base que la API (`VITE_API_URL` en dev, origin en prod) con ws/wss. */
export function chatWsUrl() {
  return `${(API_URL || window.location.origin).replace(/^http/, "ws")}/ws`
}

export function chatTopics(proyectoId: number) {
  return {
    mensajes: `/topic/proyectos/${proyectoId}/chat`,
    presencia: `/topic/proyectos/${proyectoId}/chat/presencia`,
    ia: `/topic/proyectos/${proyectoId}/chat/ia`,
  }
}
