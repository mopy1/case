import type { ChatAuthor } from "@/components/chat"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import type { ChatMensaje } from "../types/chat.types"

const ETIQUETAS_ROL: Record<RolProyecto, string> = {
  ADMIN: "Admin",
  COLABORADOR: "Colaborador",
  LECTOR: "Lector",
}

/** Une dos listas sin duplicar por `id` (el emisor recibe su mensaje por REST y por WS) y ordena por id. */
export function unirMensajes(previos: ChatMensaje[], nuevos: ChatMensaje[]): ChatMensaje[] {
  const porId = new Map(previos.map((m) => [m.id, m]))
  for (const m of nuevos) porId.set(m.id, m)
  return [...porId.values()].sort((a, b) => a.id - b.id)
}

export function etiquetaRol(rol: RolProyecto) {
  return ETIQUETAS_ROL[rol]
}

export function nombreAutor(m: ChatMensaje) {
  if (m.tipo === "IA") return "SeniorDev"
  if (m.tipo === "SISTEMA") return "Sistema"
  return m.username ?? "Ex miembro"
}

/** `ChatMensaje` → autor del sistema de chat compartido. */
export function autorDe(m: ChatMensaje): ChatAuthor {
  if (m.tipo === "IA") return { id: "seniordev", name: "Senior Dev", kind: "agent" }
  if (m.tipo === "SISTEMA") return { id: "sistema", name: "Sistema", kind: "system" }
  return { id: m.usuarioId ?? nombreAutor(m), name: nombreAutor(m), role: m.rol ? etiquetaRol(m.rol) : undefined, kind: "human" }
}
