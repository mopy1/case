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

/** Punto donde el segmento entre el centro de `desde` y `puntoExterior` cruza el borde de
 * `desde` (aproximado sobre la elipse inscripta en su rectángulo — suficiente para que se vea
 * bien y es la fórmula estándar de este patrón). */
function interseccionConPunto(desde: Rect, puntoExterior: { x: number; y: number }) {
  const w = desde.width / 2
  const h = desde.height / 2
  const x2 = desde.x + w
  const y2 = desde.y + h
  const x1 = puntoExterior.x
  const y1 = puntoExterior.y

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1

  return { x: w * (xx3 + yy3) + x2, y: h * (-xx3 + yy3) + y2 }
}

/** De qué lado del rectángulo cayó el punto de intersección — para saber si la línea sale hacia
 * arriba/abajo/izquierda/derecha (y así usar el `Position` correcto en `getSmoothStepPath`). */
function ladoDe(rect: Rect, punto: { x: number; y: number }): Position {
  const x = Math.round(punto.x)
  const y = Math.round(punto.y)
  const nx = Math.round(rect.x)
  const ny = Math.round(rect.y)

  if (x <= nx + 1) return Position.Left
  if (x >= nx + rect.width - 1) return Position.Right
  if (y <= ny + 1) return Position.Top
  return Position.Bottom
}

export interface ParametrosSalida {
  x: number
  y: number
  pos: Position
}

/** Punto de enganche de `origen` apuntando hacia un punto libre (el centro de la otra tabla, para
 * el fallback de toda la tabla) en vez de resolver ambos lados de una — cada lado de
 * `construirRutaRelacion` se resuelve por separado según si encontró o no una fila de atributo
 * a la cual anclarse. */
export function calcularParametrosAristaHaciaPunto(
  origen: InternalNode<Node>,
  puntoExterior: { x: number; y: number },
  anchoDefault = ANCHO_NODO_DEFAULT,
  altoDefault = ALTO_NODO_DEFAULT
): ParametrosSalida {
  const rect = rectDe(origen, anchoDefault, altoDefault)
  const punto = interseccionConPunto(rect, puntoExterior)
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
