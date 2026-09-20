import type { InternalNode, Node } from "@xyflow/react"
import { calcularParametrosAristaHaciaPunto, centroDe } from "./floatingEdge"
import type { PuntoControl } from "../types/diagram.types"

/** Geometría pura para la interacción de puntos de control manuales — extraído de
 * `UmlRelationEdge.tsx` (regla "Anti-1k-Lines" del proyecto). El estado/eventos de arrastre en sí
 * viven en `hooks/usePuntosControlArrastre.ts`, que usa estas funciones. */

/** Punto inicial para separar relaciones "paralelas" (mismo par de entidades, ver
 * `calcularOffsetsParalelos` en `lib/relacionesDerivadas.ts`) — punto medio entre los centros de
 * ambas tablas, corrido perpendicular a la línea que las une. Se siembra como si fuera un punto de
 * control real: si el usuario lo arrastra, se persiste igual que cualquier otro — no es una línea
 * curva aparte, es el mismo mecanismo de siempre con un valor inicial razonable en vez de arrancar
 * dos relaciones exactamente superpuestas. */
export function puntoSeparacionInicial(
  nodoOrigen: InternalNode<Node>,
  nodoDestino: InternalNode<Node>,
  offset: number
): PuntoControl {
  const c1 = centroDe(nodoOrigen)
  const c2 = centroDe(nodoDestino)
  const dx = c2.x - c1.x
  const dy = c2.y - c1.y
  const largo = Math.hypot(dx, dy) || 1
  const px = -dy / largo
  const py = dx / largo
  return { x: (c1.x + c2.x) / 2 + px * offset, y: (c1.y + c2.y) / 2 + py * offset }
}

function distanciaAlSegmento(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const largo2 = dx * dx + dy * dy
  if (largo2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / largo2
  t = Math.max(0, Math.min(1, t))
  const proyX = a.x + t * dx
  const proyY = a.y + t * dy
  return Math.hypot(p.x - proyX, p.y - proyY)
}

/** A qué índice de `puntosControl` insertar un punto nuevo agregado a mitad de la línea — el
 * segmento de la polilínea (floating edges + puntos existentes) más cercano al punto donde se
 * hizo Ctrl+arrastrar. */
export function encontrarSegmentoMasCercano(
  punto: { x: number; y: number },
  nodoOrigen: InternalNode<Node> | undefined,
  nodoDestino: InternalNode<Node> | undefined,
  puntosControl: PuntoControl[]
): number {
  if (!nodoOrigen || !nodoDestino) return puntosControl.length

  const primerPunto = puntosControl[0] ?? centroDe(nodoDestino)
  const ultimoPunto = puntosControl[puntosControl.length - 1] ?? centroDe(nodoOrigen)
  const salida = calcularParametrosAristaHaciaPunto(nodoOrigen, primerPunto)
  const entrada = calcularParametrosAristaHaciaPunto(nodoDestino, ultimoPunto)
  const ruta = [{ x: salida.x, y: salida.y }, ...puntosControl, { x: entrada.x, y: entrada.y }]

  let mejorIndice = 0
  let mejorDistancia = Infinity
  for (let i = 0; i < ruta.length - 1; i++) {
    const distancia = distanciaAlSegmento(punto, ruta[i], ruta[i + 1])
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia
      mejorIndice = i
    }
  }
  return mejorIndice
}
