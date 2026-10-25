import type { HerramientaIa } from "../types/chat.types"

const ETIQUETAS: Record<HerramientaIa, string> = {
  obtenerDiagrama: "Diagrama",
  listarTareas: "Tareas",
  listarNotas: "ADRs",
  buscarEnHistorial: "Historial",
}

/** `herramientasUsadas` → etiquetas para "Consultó: Diagrama · Historial" (ignora nombres desconocidos). */
export function fuentesIa(herramientas: readonly string[] | null | undefined): string[] {
  if (!herramientas) return []
  return herramientas.filter((h): h is HerramientaIa => h in ETIQUETAS).map((h) => ETIQUETAS[h])
}
