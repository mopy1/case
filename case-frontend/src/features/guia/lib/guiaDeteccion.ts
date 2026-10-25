import type { ChatMensaje } from "@/features/chat/types/chat.types"
import type { DiagramaResponse } from "@/features/diagram/types/diagram.types"
import type { NotaResponse } from "@/features/notes/types/notes.type"
import type { listarProyectosResponse, MiembroProyectoResponse } from "@/features/projects/types/projects.type"
import type { AuthUser } from "@/hooks/useAuth"
import type { MisionId } from "../types/guia.types"

/** Lo que se pudo leer del backend (una fuente caída queda `undefined` y no marca nada). */
export interface DatosGuia {
  proyectos?: listarProyectosResponse[]
  diagrama?: DiagramaResponse
  miembros?: MiembroProyectoResponse[]
  mensajes?: ChatMensaje[]
  notas?: NotaResponse[]
}

export type FuenteGuia = keyof DatosGuia

/** Qué fuentes hace falta pedir para cada misión (EXPORTAR no deja rastro: solo por evento). */
export const FUENTES_POR_MISION: Record<MisionId, FuenteGuia[]> = {
  CREAR_PROYECTO: ["proyectos"],
  CREAR_TABLAS: ["diagrama"],
  RELACIONAR: ["diagrama"],
  INVITAR: ["miembros"],
  PREGUNTAR_SENIOR_DEV: ["mensajes"],
  APLICAR_O_ADR: ["mensajes", "notas"],
  EXPORTAR: [],
}

const MENCION_IA = /@seniordev\b/i

/** Misiones que los datos ya demuestran (lógica pura, sin efectos). */
export function detectarMisiones(d: DatosGuia, yo: AuthUser): MisionId[] {
  const logradas: MisionId[] = []
  if (d.proyectos?.some((p) => p.miRol === "ADMIN")) logradas.push("CREAR_PROYECTO")
  if (d.diagrama && d.diagrama.entidades.filter((e) => e.atributos.length > 0).length >= 2) logradas.push("CREAR_TABLAS")
  if (d.diagrama && d.diagrama.relaciones.length >= 1) logradas.push("RELACIONAR")
  if (d.miembros && d.miembros.length >= 2) logradas.push("INVITAR")
  if (d.mensajes?.some((m) => m.tipo === "USUARIO" && m.usuarioId === yo.id && MENCION_IA.test(m.contenido))) {
    logradas.push("PREGUNTAR_SENIOR_DEV")
  }
  const aplico = d.mensajes?.some((m) => m.propuestaAplicada && m.aplicadoPor === yo.username)
  if (aplico || d.notas?.some((n) => n.usuarioId === yo.id)) logradas.push("APLICAR_O_ADR")
  return logradas
}
