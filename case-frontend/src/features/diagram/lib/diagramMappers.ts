import type { Edge, Node } from "@xyflow/react"
import type { EntidadDiagramaResponse, LadoMultiplicidad, PuntoControl, RelacionDiagramaResponse } from "../types/diagram.types"

/** Traducen los DTOs del backend a la forma que espera React Flow — extraído de
 * `useDiagramCanvas.ts` (regla "Anti-1k-Lines" del proyecto): son funciones puras sin estado,
 * no necesitan vivir junto a la orquestación del hook. */

export function entidadANodo(entidad: EntidadDiagramaResponse, onDelete: () => void, esTablaIntermedia: boolean): Node {
  return {
    id: String(entidad.id),
    type: "entidad",
    position: { x: entidad.posX, y: entidad.posY },
    data: { entidad, onDelete, esTablaIntermedia },
  }
}

export function relacionAArista(
  relacion: RelacionDiagramaResponse,
  onEditOrigen: (lado: LadoMultiplicidad) => void,
  onEditDestino: (lado: LadoMultiplicidad) => void,
  onDelete: () => void,
  onMoverPuntos: (puntos: PuntoControl[]) => void,
  offsetParalelo: number,
  resaltada: boolean
): Edge {
  return {
    id: String(relacion.id),
    type: "relacion",
    // Sin sourceHandle/targetHandle fijo — `EntityNode` tiene 4 puntos de conexión (uno por
    // lado) y `UmlRelationEdge` recalcula solo cuál usar según dónde está la otra tabla (ver
    // `lib/floatingEdge.ts`), no le importa cuál de los 4 se haya usado al conectar.
    source: String(relacion.entidadOrigenId),
    target: String(relacion.entidadDestinoId),
    data: { relacion, onEditOrigen, onEditDestino, onDelete, onMoverPuntos, offsetParalelo, resaltada },
  }
}
