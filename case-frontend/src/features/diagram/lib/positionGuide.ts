export interface EntityPosition {
  posX: number
  posY: number
}

export const NODE_WIDTH = 270
export const NODE_HEIGHT = 220
export const HORIZONTAL_SPACING = 70
export const VERTICAL_SPACING = 60
export const START_X = 80
export const START_Y = 80
export const MAX_COLUMNS = 3

/**
 * Verifica si dos cajas delimitadoras de tablas se solapan (colisionan)
 */
export function doEntitiesOverlap(
  pos1: EntityPosition,
  pos2: EntityPosition,
  padX = 30,
  padY = 30
): boolean {
  return (
    Math.abs(pos1.posX - pos2.posX) < NODE_WIDTH + padX &&
    Math.abs(pos1.posY - pos2.posY) < NODE_HEIGHT + padY
  )
}

/**
 * Encuentra una posición libre en la cuadrícula que no colisione con ninguna tabla existente
 */
export function findSafeEntityPosition(
  existingEntities: EntityPosition[],
  reservedPositions: EntityPosition[] = []
): EntityPosition {
  const allOccupied = [...existingEntities, ...reservedPositions]

  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < MAX_COLUMNS; col++) {
      const candidate: EntityPosition = {
        posX: START_X + col * (NODE_WIDTH + HORIZONTAL_SPACING),
        posY: START_Y + row * (NODE_HEIGHT + VERTICAL_SPACING),
      }

      const collides = allOccupied.some((occupied) =>
        doEntitiesOverlap(candidate, occupied)
      )

      if (!collides) {
        return candidate
      }
    }
  }

  const count = allOccupied.length
  return {
    posX: START_X + (count % MAX_COLUMNS) * (NODE_WIDTH + HORIZONTAL_SPACING),
    posY: START_Y + Math.floor(count / MAX_COLUMNS) * (NODE_HEIGHT + VERTICAL_SPACING),
  }
}

/**
 * Encuentra N posiciones libres consecutivas sin colisiones entre sí ni con las existentes
 */
export function findMultipleSafeEntityPositions(
  existingEntities: EntityPosition[],
  count: number
): EntityPosition[] {
  const result: EntityPosition[] = []
  for (let i = 0; i < count; i++) {
    const nextSafe = findSafeEntityPosition(existingEntities, result)
    result.push(nextSafe)
  }
  return result
}
