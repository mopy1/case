import type { AdrSuggestion, CopilotSection, KnowledgeTopic } from "../types/copilot.types"
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

export function getQuickQuestionsForSection(section: CopilotSection): string[] {
  switch (section) {
    case "diagrama":
      return [
        "¿Cómo crear una relación N:M?",
        "¿Qué tipos de datos soporta?",
        "Sugerir decisiones de arquitectura",
        "¿Cómo se arrastran los puntos de control?",
      ]
    case "generador":
      return [
        "¿Qué dependencias incluye el pom.xml?",
        "¿Cómo ejecuto el backend descargado?",
        "¿Qué capas de código genera?",
      ]
    case "xmi":
      return [
        "¿Cómo importar este XMI en Enterprise Architect?",
        "¿Cómo exportar el diagrama para Enterprise Architect 16?",
      ]
    case "notas":
      return [
        "¿Qué es un ADR y por qué es inmutable?",
        "¿Cómo justificar decisiones de arquitectura ante el docente?",
        "Sugerir decisiones de arquitectura",
      ]
    case "tareas":
      return [
        "¿Cómo organizar el backlog del backend?",
        "¿Cómo vincular tareas a los colaboradores del proyecto?",
      ]
    default:
      return [
        "¿Cómo crear una relación N:M?",
        "¿Qué tipos de datos soporta?",
        "Sugerir decisiones de arquitectura",
      ]
  }
}

export function generateLocalResponse(
  query: string,
  section: CopilotSection
): { text: string; adrSuggestion?: AdrSuggestion } {
  const isAdrRequest = /sugerir|decision|adrs?|normaliza|arquitectura/i.test(query)
  const matches = searchKnowledge(query, section)
  const bestTopic = matches[0] || KNOWLEDGE_TOPICS[0]

  if (isAdrRequest) {
    const topicWithAdr = matches.find((t) => t.suggestedAdr) || KNOWLEDGE_TOPICS.find((t) => t.suggestedAdr)
    const adr = topicWithAdr?.suggestedAdr ?? {
      accion: "Normalizar relación N:M mediante tabla intermedia de asociación",
      motivo: "Descomponer la relación muchos a muchos en dos relaciones 1:N hacia una entidad puente para almacenar atributos de transacción y garantizar la 3FN.",
    }

    return {
      text: `### 💡 Decisión Arquitectónica Recomendada

Para mantener un diseño relacional escalable y alineado con las buenas prácticas de la herramienta CASE, se sugiere la siguiente decisión:

• **Acción:** ${adr.accion}
• **Motivo Técnico:** ${adr.motivo}

Puedes registrar esta decisión directamente en la bitácora del proyecto con el botón a continuación.`,
      adrSuggestion: adr,
    }
  }

  return {
    text: `### 📌 ${bestTopic.title}

${bestTopic.content}`,
    adrSuggestion: bestTopic.suggestedAdr,
  }
}
