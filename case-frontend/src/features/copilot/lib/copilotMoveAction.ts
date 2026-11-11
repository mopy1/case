import { getDiagram, updateEntity } from "@/features/diagram/api/diagramApi"
import type { MovimientoTabla } from "../types/copilot.types"

/**
 * Aplica los `MOVER_TABLA` de una respuesta: busca cada tabla por nombre (sin distinguir mayúsculas) y le
 * cambia solo la posición con `PUT /entidades/{id}` (el mismo que usa el lienzo al soltar una tabla).
 * Las tablas que no existen se saltean. Devuelve cuántas se movieron.
 */
export async function executeMoveTables(proyectoId: number, movimientos: MovimientoTabla[]): Promise<number> {
  const diagrama = await getDiagram(proyectoId)
  const porNombre = new Map(diagrama.entidades.map((e) => [e.nombre.toLowerCase(), e]))
  let movidas = 0
  for (const m of movimientos) {
    const entidad = porNombre.get(m.tabla.toLowerCase())
    if (!entidad) continue
    await updateEntity(proyectoId, entidad.id, { nombre: entidad.nombre, posX: m.posX, posY: m.posY })
    movidas++
  }
  window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId } }))
  return movidas
}
