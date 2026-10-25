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

export function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
}

export function etiquetaRol(rol: RolProyecto) {
  return ETIQUETAS_ROL[rol]
}

export function nombreAutor(m: ChatMensaje) {
  if (m.tipo === "IA") return "SeniorDev"
  if (m.tipo === "SISTEMA") return "Sistema"
  return m.username ?? "Ex miembro"
}
