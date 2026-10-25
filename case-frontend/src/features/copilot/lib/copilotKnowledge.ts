import { findSafeEntityPosition, type EntityPosition } from "@/features/diagram/lib/positionGuide"
import type {
  AdrSuggestion,
  AttributeSuggestion,
  CopilotSection,
  EntityDeleteSuggestion,
  EntitySuggestion,
  KnowledgeTopic,
  RelationSuggestion,
} from "../types/copilot.types"
import { KNOWLEDGE_TOPICS } from "./copilotKnowledge.data"

export { KNOWLEDGE_TOPICS }

export function searchKnowledge(query: string, section?: CopilotSection): KnowledgeTopic[] {
  const q = query.toLowerCase().trim()
  if (!q) return KNOWLEDGE_TOPICS

  const queryTerms = q.split(/\s+/).filter(Boolean)

  const scored = KNOWLEDGE_TOPICS.map((topic) => {
    let score = 0
    const titleLower = topic.title.toLowerCase()
    const summaryLower = topic.summary.toLowerCase()

    if (titleLower.includes(q)) score += 10
    if (summaryLower.includes(q)) score += 6

    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 3
      if (summaryLower.includes(term)) score += 2
      if (topic.keywords.some((k) => k.toLowerCase().includes(term))) score += 4
    }

    if (section && topic.section === section) {
      score += 2
    }

    return { topic, score }
  })

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.topic)
}

export { getQuickQuestionsForSection } from "./copilotQuestions"

export function generateLocalResponse(
  query: string,
  section: CopilotSection,
  existingEntities: EntityPosition[] = []
): {
  text: string
  adrSuggestion?: AdrSuggestion
  entitySuggestions?: EntitySuggestion[]
  relationSuggestions?: RelationSuggestion[]
  attributeSuggestions?: AttributeSuggestion[]
  entityDeleteSuggestions?: EntityDeleteSuggestion[]
} {
  const isCreateTable = /(?:crear|nueva|agregar|diseñar)\s+(?:tabla|entidad)\s+([a-zA-Z0-9_]+)/i.exec(query)
  const isCreateRelation = /(?:relacion(?:ar)?|conectar)\s+([a-zA-Z0-9_]+)\s+(?:con|a|y)\s+([a-zA-Z0-9_]+)/i.exec(query)
  const isAddAttribute = /(?:agregar|añadir|crear)\s+atributo\s+([a-zA-Z0-9_]+)(?:\s*:([a-zA-Z0-9_]+))?\s+a\s+([a-zA-Z0-9_]+)/i.exec(query)
  const isDeleteTable = /(?:eliminar|borrar|quitar)\s+tabla\s+([a-zA-Z0-9_]+)/i.exec(query)

  if (isAddAttribute) {
    const attrName = isAddAttribute[1]
    const tipo = (isAddAttribute[2] || "VARCHAR").toUpperCase()
    const tableName = isAddAttribute[3]
    return {
      text: `He preparado el atributo **${attrName}** (${tipo}) para la tabla **${tableName}**.`,
      attributeSuggestions: [
        { tabla: tableName, nombre: attrName, tipoSql: tipo, esPk: false, nullable: true, creada: false },
      ],
    }
  }

  if (isDeleteTable) {
    const tableName = isDeleteTable[1]
    return {
      text: `He preparado la eliminación de la tabla **${tableName}** del lienzo.`,
      entityDeleteSuggestions: [{ tabla: tableName, eliminada: false }],
    }
  }

  if (isCreateTable) {
    const tableName = isCreateTable[1]
    const safePos = findSafeEntityPosition(existingEntities)
    return {
      text: `He preparado la estructura para la tabla **${tableName}** en la posición libre (x: ${safePos.posX}, y: ${safePos.posY}).`,
      entitySuggestions: [
        {
          nombre: tableName.charAt(0).toUpperCase() + tableName.slice(1),
          posX: safePos.posX,
          posY: safePos.posY,
          atributos: [
            { nombre: "id", tipoSql: "BIGINT", esPk: true, esFk: false, nullable: false },
            { nombre: "nombre", tipoSql: "VARCHAR", esPk: false, esFk: false, nullable: false },
            { nombre: "estado", tipoSql: "VARCHAR", esPk: false, esFk: false, nullable: true },
          ],
          creada: false,
        },
      ],
    }
  }

  if (isCreateRelation) {
    const origen = isCreateRelation[1]
    const destino = isCreateRelation[2]
    const isMany = /muchos|n:m|n a m|varias|varios/i.test(query)
    return {
      text: isMany
        ? `He preparado la relación muchos a muchos (N:M) entre **${origen}** y **${destino}**. El sistema creará la tabla intermedia automáticamente.`
        : `He preparado la relación 1:N entre **${origen}** y **${destino}**.`,
      relationSuggestions: [
        {
          origen,
          destino,
          multiplicidadOrigen: "UNO_O_MAS",
          multiplicidadDestino: isMany ? "UNO_O_MAS" : "UNO",
          creada: false,
        },
      ],
    }
  }

  const isAdrRequest = /sugerir|decision|adrs?|normaliza|arquitectura/i.test(query)
  const matches = searchKnowledge(query, section)
  const bestTopic = matches[0] || KNOWLEDGE_TOPICS[0]

  if (isAdrRequest) {
    const topicWithAdr = matches.find((t) => t.suggestedAdr) || KNOWLEDGE_TOPICS.find((t) => t.suggestedAdr)
    const adr = topicWithAdr?.suggestedAdr ?? {
      accion: "Normalizar relación N:M mediante tabla intermedia de asociación",
      motivo: "Descomponer la relación muchos a muchos en dos relaciones 1:N para garantizar la 3FN.",
    }

    return {
      text: `### Decisión Arquitectónica Recomendada\n\n• **Acción:** ${adr.accion}\n• **Motivo Técnico:** ${adr.motivo}`,
      adrSuggestion: adr,
    }
  }

  return {
    text: `### ${bestTopic.title}\n\n${bestTopic.content}`,
    adrSuggestion: bestTopic.suggestedAdr,
  }
}
