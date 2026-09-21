import { Position, type InternalNode, type Node } from "@xyflow/react"

/**
 * "Floating edge" — en vez de una relación siempre saliendo del mismo lado fijo (antes: derecha
 * del origen, izquierda del destino, sin importar dónde estuviera la otra tabla), el punto de
 * enganche se recalcula solo cada vez según la posición real de ambas tablas. Es la técnica que
 * recomienda la propia documentación de React Flow para esto. Usado como *fallback* por
 * `lib/relationPath.ts` cuando no hay una fila de atributo específica a la cual anclar la línea
 * (ver esa nota — 2026-09-20, "que se maneje como dbdiagram.io": ahí es donde vive el anclaje a
 * fila real, esto solo cubre el caso sin atributo FK/PK identificable).
 */

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export const ANCHO_NODO_DEFAULT = 256
export const ALTO_NODO_DEFAULT = 90

function rectDe(nodo: InternalNode<Node>, anchoDefault: number, altoDefault: number): Rect {
  const { x, y } = nodo.internals.positionAbsolute
  return {
    x,
    y,
    width: nodo.measured?.width ?? anchoDefault,
    height: nodo.measured?.height ?? altoDefault,
  }
}

/** Centro absoluto de un nodo — usado como "punto exterior" para el fallback de toda la tabla. */
export function centroDe(nodo: InternalNode<Node>, anchoDefault = ANCHO_NODO_DEFAULT, altoDefault = ALTO_NODO_DEFAULT) {
  const rect = rectDe(nodo, anchoDefault, altoDefault)
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

/** Punto donde el segmento entre el centro de `desde` y `puntoExterior` cruza el borde del
 * rectángulo de `desde` con soporte de margen/gap opcional hacia afuera. */
function interseccionConPunto(desde: Rect, puntoExterior: { x: number; y: number }, gap = 0) {
  const cx = desde.x + desde.width / 2
  const cy = desde.y + desde.height / 2
  const dx = puntoExterior.x - cx
  const dy = puntoExterior.y - cy

  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return { x: cx, y: cy }
  }

  const hw = desde.width / 2 + gap
  const hh = desde.height / 2 + gap

  const scaleX = hw / Math.abs(dx)
  const scaleY = hh / Math.abs(dy)
  const scale = Math.min(scaleX, scaleY)

  return { x: cx + dx * scale, y: cy + dy * scale }
}

/** De qué lado del rectángulo cayó el punto de intersección — comparando el ángulo contra las diagonales. */
function ladoDe(rect: Rect, punto: { x: number; y: number }): Position {
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const dx = punto.x - cx
  const dy = punto.y - cy
  const hw = rect.width / 2
  const hh = rect.height / 2

  if (Math.abs(dx) * hh >= Math.abs(dy) * hw) {
    return dx >= 0 ? Position.Right : Position.Left
  }
  return dy >= 0 ? Position.Bottom : Position.Top
}

export interface ParametrosSalida {
  x: number
  y: number
  pos: Position
}

/** Punto de enganche de `origen` apuntando hacia un punto libre con soporte de separación (gap). */
export function calcularParametrosAristaHaciaPunto(
  origen: InternalNode<Node>,
  puntoExterior: { x: number; y: number },
  anchoDefault = ANCHO_NODO_DEFAULT,
  altoDefault = ALTO_NODO_DEFAULT,
  gap = 0
): ParametrosSalida {
  const rect = rectDe(origen, anchoDefault, altoDefault)
  const punto = interseccionConPunto(rect, puntoExterior, gap)
  return { x: punto.x, y: punto.y, pos: ladoDe(rect, punto) }
}

/** Offset perpendicular al borde por el que sale la línea — para plantar el paréntesis de
 * multiplicidad justo afuera de la tabla sin importar de qué lado salió. */
export function offsetDesdePosicion(pos: Position, magnitud: number): { dx: number; dy: number } {
  switch (pos) {
    case Position.Top:
      return { dx: 0, dy: -magnitud }
    case Position.Bottom:
      return { dx: 0, dy: magnitud }
    case Position.Left:
      return { dx: -magnitud, dy: 0 }
    case Position.Right:
      return { dx: magnitud, dy: 0 }
  }
}
