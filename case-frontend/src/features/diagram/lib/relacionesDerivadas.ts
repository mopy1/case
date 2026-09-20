import { esMuchosAMuchos } from "./multiplicidad"
import type { EntidadDiagramaResponse, PuntoControl, RelacionDiagramaResponse } from "../types/diagram.types"

/** Datos derivados del conjunto completo de relaciones de un diagrama (no de una relación
 * puntual) — extraído de `useDiagramCanvas.ts` (regla "Anti-1k-Lines" del proyecto): son
 * funciones puras de transformación, no necesitan vivir junto a la orquestación del hook. */

export interface AsociacionClase {
  id: string
  origenId: number
  destinoId: number
  junctionId: number
  relacionOrigenId: number
  relacionDestinoId: number
  /** Puntos de control de la relación N:M real (`mn`) — así el punteado hacia la tabla intermedia
   * (`AssociationClassOverlay`) arranca del mismo punto medio visible que dibuja `UmlRelationEdge`
   * para esa relación, en vez de recalcular un floating edge aparte que ignora si el usuario la
   * "quebró" a mano (bug real corregido 2026-09-20, ver `case-frontend/AGENTS.md`). */
  puntosControl: PuntoControl[]
}

/**
 * Detecta el patrón "tabla intermedia de N:M": una relación MUCHOS_A_MUCHOS entre A y B más una
 * entidad J con una relación UNO_A_MUCHOS desde A y otra desde B. Esas dos físicas se dibujan
 * como una sola línea de "clase de asociación" (ver AssociationClassOverlay), no como aristas
 * sueltas — así que acá también se devuelven sus ids para excluirlas de la lista normal.
 */
export function detectarAsociacionesClase(diagrama: {
  entidades: EntidadDiagramaResponse[]
  relaciones: RelacionDiagramaResponse[]
}) {
  const asociaciones: AsociacionClase[] = []
  const idsFisicasConsumidas = new Set<number>()

  const esFisicaUnoAMuchos = (r: RelacionDiagramaResponse) =>
    r.multiplicidadOrigen === "UNO" && r.multiplicidadDestino === "UNO_O_MAS"

  for (const mn of diagrama.relaciones) {
    if (!esMuchosAMuchos(mn.multiplicidadOrigen, mn.multiplicidadDestino)) continue
    for (const junction of diagrama.entidades) {
      if (junction.id === mn.entidadOrigenId || junction.id === mn.entidadDestinoId) continue
      // Candidatas hacia esta junction primero, y recién ahí se reparten por lado — si la N:M es
      // recursiva (origen === destino, ej. "empleado" relacionado consigo mismo) ambas físicas
      // tienen el mismo entidadOrigenId, así que hay que excluir la ya asignada a `relOrigen` al
      // buscar `relDestino`, si no las dos terminan apuntando a la misma fila física.
      const candidatas = diagrama.relaciones.filter((r) => esFisicaUnoAMuchos(r) && r.entidadDestinoId === junction.id)
      const relOrigen = candidatas.find((r) => r.entidadOrigenId === mn.entidadOrigenId)
      const relDestino = candidatas.find((r) => r.entidadOrigenId === mn.entidadDestinoId && r.id !== relOrigen?.id)
      if (!relOrigen || !relDestino) continue
      asociaciones.push({
        id: `assoc-${mn.id}`,
        origenId: mn.entidadOrigenId,
        destinoId: mn.entidadDestinoId,
        junctionId: junction.id,
        relacionOrigenId: relOrigen.id,
        relacionDestinoId: relDestino.id,
        puntosControl: mn.puntosControl,
      })
      idsFisicasConsumidas.add(relOrigen.id)
      idsFisicasConsumidas.add(relDestino.id)
      break
    }
  }

  return { asociaciones, idsFisicasConsumidas }
}

/** Separación px en flow-space entre relaciones "paralelas" — mismo par de entidades, sin puntos
 * de control propios todavía. */
const SEPARACION_PARALELA_PX = 40

/**
 * Cuando hay 2+ relaciones entre el MISMO par de entidades (ej. proyecto 10: dos relaciones
 * `diagrama_relaciones -> diagrama_entidades` reales), sin puntos de control ninguna calculan el
 * mismo floating edge exacto — quedan una encima de la otra, indistinguibles (reportado: "una tapa
 * a la otra"). Acá se les asigna un offset perpendicular simétrico (ej. 2 relaciones: -20/+20) que
 * `UmlRelationEdge` usa para sembrar un punto de control inicial — no es una línea curva aparte,
 * es exactamente el mismo mecanismo de puntos arrastrables de siempre, solo con un valor inicial
 * razonable en vez de arrancar las dos superpuestas. Relaciones que YA tienen un punto de control
 * propio se excluyen (el usuario ya las resolvió a mano); recursivas también (no aplica floating
 * edge). Devuelve `relacionId -> offset` (0 si no le corresponde separación). */
export function calcularOffsetsParalelos(relaciones: RelacionDiagramaResponse[]): Map<number, number> {
  const grupos = new Map<string, RelacionDiagramaResponse[]>()
  for (const r of relaciones) {
    if (r.entidadOrigenId === r.entidadDestinoId) continue
    if (r.puntosControl.length > 0) continue
    const clave = [r.entidadOrigenId, r.entidadDestinoId].sort((a, b) => a - b).join("-")
    const grupo = grupos.get(clave)
    if (grupo) grupo.push(r)
    else grupos.set(clave, [r])
  }

  const offsets = new Map<number, number>()
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue
    grupo.forEach((r, i) => offsets.set(r.id, (i - (grupo.length - 1) / 2) * SEPARACION_PARALELA_PX))
  }
  return offsets
}
