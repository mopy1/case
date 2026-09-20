import type { InternalNode, Node } from "@xyflow/react"
import { calcularParametrosAristaHaciaPunto, centroDe, offsetDesdePosicion } from "./floatingEdge"
import type { PuntoControl } from "../types/diagram.types"

/**
 * Arma la línea de una relación no recursiva como una polilínea recta: floating edge de `origen`
 * hacia el primer punto de control (o hacia el centro de `destino` si no hay ninguno), una línea
 * recta por cada punto de control intermedio, y floating edge de `destino` hacia el último punto
 * (o hacia el centro de `origen`). Sin puntos de control, esto se reduce exactamente al floating
 * edge simple de siempre (una sola línea recta entre ambos bordes). Usado por `UmlRelationEdge`
 * (dibuja la línea real, con los puntos siendo arrastrables) y por `AssociationClassOverlay`
 * (necesita el mismo punto medio para anclar el punteado hacia la tabla intermedia de una N:M).
 */

export interface RutaRelacion {
  edgePath: string
  labelX: number
  labelY: number
  origenX: number
  origenY: number
  destinoX: number
  destinoY: number
}

interface Punto {
  x: number
  y: number
}

/** Punto a mitad de camino (por longitud recorrida, no por índice) de una polilínea — para que el
 * label/botón de borrado quede sobre la línea real sin importar cuántos puntos de control tenga. */
function puntoMedioDeRuta(puntos: Punto[]): Punto {
  const largos: number[] = []
  let total = 0
  for (let i = 1; i < puntos.length; i++) {
    const largo = Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y)
    largos.push(largo)
    total += largo
  }

  const mitad = total / 2
  let acumulado = 0
  for (let i = 0; i < largos.length; i++) {
    if (acumulado + largos[i] >= mitad) {
      const t = largos[i] === 0 ? 0 : (mitad - acumulado) / largos[i]
      const a = puntos[i]
      const b = puntos[i + 1]
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    acumulado += largos[i]
  }
  return puntos[Math.floor(puntos.length / 2)]
}

export function construirRutaRelacion(
  nodoOrigen: InternalNode<Node>,
  nodoDestino: InternalNode<Node>,
  puntosControl: PuntoControl[]
): RutaRelacion {
  const primerPunto = puntosControl[0] ?? centroDe(nodoDestino)
  const ultimoPunto = puntosControl[puntosControl.length - 1] ?? centroDe(nodoOrigen)

  const salida = calcularParametrosAristaHaciaPunto(nodoOrigen, primerPunto)
  const entrada = calcularParametrosAristaHaciaPunto(nodoDestino, ultimoPunto)

  const puntosRuta: Punto[] = [
    { x: salida.x, y: salida.y },
    ...puntosControl.map((p) => ({ x: p.x, y: p.y })),
    { x: entrada.x, y: entrada.y },
  ]
  const edgePath = puntosRuta.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
  const { x: labelX, y: labelY } = puntoMedioDeRuta(puntosRuta)

  const offOrigen = offsetDesdePosicion(salida.pos, 18)
  const offDestino = offsetDesdePosicion(entrada.pos, 18)

  return {
    edgePath,
    labelX,
    labelY,
    origenX: salida.x + offOrigen.dx,
    origenY: salida.y + offOrigen.dy,
    destinoX: entrada.x + offDestino.dx,
    destinoY: entrada.y + offDestino.dy,
  }
}
