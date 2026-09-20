import { createAttribute, createEntity, createRelation, updateRelation, getDiagram } from "@/features/diagram/api/diagramApi"
import { findSafeEntityPosition } from "@/features/diagram/lib/positionGuide"
import type { EntitySuggestion, RelationSuggestion } from "../types/copilot.types"

export async function executeCreateEntity(
  proyectoId: number,
  entity: EntitySuggestion
): Promise<void> {
  const diagram = await getDiagram(proyectoId)
  let posX = entity.posX
  let posY = entity.posY

  if (posX == null || posY == null) {
    const safePos = findSafeEntityPosition(diagram.entidades)
    posX = safePos.posX
    posY = safePos.posY
  }

  const nuevaEntidad = await createEntity(proyectoId, {
    nombre: entity.nombre,
    posX,
    posY,
  })

  if (entity.atributos && entity.atributos.length > 0) {
    for (const attr of entity.atributos) {
      await createAttribute(proyectoId, nuevaEntidad.id, {
        nombre: attr.nombre,
        tipoSql: attr.tipoSql || "VARCHAR",
        esPk: !!attr.esPk,
        esFk: false,
        referenciaEntidadId: null,
        nullable: attr.nullable ?? !attr.esPk,
      })
    }
  }

  window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId } }))
}

export async function executeCreateRelation(
  proyectoId: number,
  relation: RelationSuggestion
): Promise<void> {
  const diagram = await getDiagram(proyectoId)
  const origen = diagram.entidades.find(
    (e) => e.nombre.trim().toLowerCase() === relation.origen.trim().toLowerCase()
  )
  const destino = diagram.entidades.find(
    (e) => e.nombre.trim().toLowerCase() === relation.destino.trim().toLowerCase()
  )

  if (!origen || !destino) {
    const missing = !origen ? relation.origen : relation.destino
    throw new Error(`La tabla "${missing}" no existe en el lienzo. Créala antes de relacionarla.`)
  }

  // Si ya existe una relación previa entre estas dos entidades, se actualiza para no duplicar líneas
  const existingRel = diagram.relaciones.find(
    (r) =>
      (r.entidadOrigenId === origen.id && r.entidadDestinoId === destino.id) ||
      (r.entidadOrigenId === destino.id && r.entidadDestinoId === origen.id)
  )

  if (existingRel) {
    const isSameDir = existingRel.entidadOrigenId === origen.id
    await updateRelation(proyectoId, existingRel.id, {
      entidadOrigenId: existingRel.entidadOrigenId,
      entidadDestinoId: existingRel.entidadDestinoId,
      multiplicidadOrigen: isSameDir ? relation.multiplicidadOrigen : relation.multiplicidadDestino,
      multiplicidadDestino: isSameDir ? relation.multiplicidadDestino : relation.multiplicidadOrigen,
    })
  } else {
    await createRelation(proyectoId, {
      entidadOrigenId: origen.id,
      entidadDestinoId: destino.id,
      multiplicidadOrigen: relation.multiplicidadOrigen,
      multiplicidadDestino: relation.multiplicidadDestino,
    })
  }

  window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId } }))
}

export function updateEntityCreatedInMessages(
  messages: any[],
  messageId: string,
  index: number
): any[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.entitySuggestions
      ? {
          ...msg,
          entitySuggestions: msg.entitySuggestions.map((e: any, i: number) =>
            i === index ? { ...e, creada: true } : e
          ),
        }
      : msg
  )
}

export function updateRelationCreatedInMessages(
  messages: any[],
  messageId: string,
  index: number
): any[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.relationSuggestions
      ? {
          ...msg,
          relationSuggestions: msg.relationSuggestions.map((r: any, i: number) =>
            i === index ? { ...r, creada: true } : r
          ),
        }
      : msg
  )
}

