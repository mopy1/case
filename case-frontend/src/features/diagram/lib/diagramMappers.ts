import type { Edge, Node } from "@xyflow/react"
import type {
  EntidadDiagramaResponse,
  LadoMultiplicidad,
  PuntoControl,
  RelacionDiagramaResponse,
  TipoRelacionUml,
} from "../types/diagram.types"

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
  onEditTipo: (tipo: TipoRelacionUml) => void,
  onDelete: () => void,
  onMoverPuntos: (puntos: PuntoControl[]) => void,
  offsetParalelo: number,
  resaltada: boolean
): Edge {
  return {
    id: String(relacion.id),
    type: "relacion",
    source: String(relacion.entidadOrigenId),
    target: String(relacion.entidadDestinoId),
    data: { relacion, onEditOrigen, onEditDestino, onEditTipo, onDelete, onMoverPuntos, offsetParalelo, resaltada },
  }
}
