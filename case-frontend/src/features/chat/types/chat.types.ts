import type { RolProyecto } from "@/features/projects/types/projects.type"

export type TipoMensajeChat = "USUARIO" | "IA" | "SISTEMA"

export type EstadoIaChat = "INACTIVO" | "PENSANDO" | "RESPONDIDO" | "ERROR"

/** Evento efímero de estado de la IA emitido en /topic/proyectos/{id}/chat/ia. */
export interface ChatIaEstadoEvent {
  proyectoId: number
  estado: EstadoIaChat
  detalle?: string | null
  respuestaAId?: number | null
}

/** Espejo de ChatMensajeResponse (REST 201/200 y tópico /topic/proyectos/{id}/chat). */
export interface ChatMensaje {
  id: number
  proyectoId: number
  usuarioId: number | null
  username: string | null
  rol: RolProyecto | null
  tipo: TipoMensajeChat
  contenido: string
  respuestaAId: number | null
  createdAt: string // ISO-8601
}

export interface EnviarMensajeRequest {
  contenido: string
}

export interface UsuarioEnSala {
  usuarioId: number
  username: string
}

/** Espejo de ChatPresenciaResponse (GET /chat/presencia y tópico .../chat/presencia). */
export interface ChatPresencia {
  proyectoId: number
  usuarios: UsuarioEnSala[]
}

export type EstadoConexionChat = "conectando" | "conectado" | "reconectando" | "error"

export const CHAT_LIMITE_PAGINA = 30
export const CHAT_MAX_CARACTERES = 4000
