import { listarMensajes } from "@/features/chat/api/chatApi"
import { getDiagram } from "@/features/diagram/api/diagramApi"
import { getNotes } from "@/features/notes/api/notesApi"
import { getMyProjects, getProjectMembers } from "@/features/projects/api/projectsApi"
import type { DatosGuia, FuenteGuia } from "../lib/guiaDeteccion"

const CHAT_LIMITE_DETECCION = 100

const PEDIR: Record<FuenteGuia, (proyectoId: number) => Promise<unknown>> = {
  proyectos: () => getMyProjects(),
  diagrama: (p) => getDiagram(p),
  miembros: (p) => getProjectMembers(p),
  mensajes: (p) => listarMensajes(p, undefined, CHAT_LIMITE_DETECCION),
  notas: (p) => getNotes(p),
}

/** Pide solo las fuentes indicadas, en paralelo; una fuente caída se ignora (se reintenta en el próximo evento). */
export async function cargarDatosGuia(proyectoId: number, fuentes: FuenteGuia[]): Promise<DatosGuia> {
  const resultados = await Promise.allSettled(fuentes.map((f) => PEDIR[f](proyectoId)))
  const pares = resultados.flatMap((r, i) => (r.status === "fulfilled" ? [[fuentes[i], r.value]] : []))
  return Object.fromEntries(pares) as DatosGuia
}
