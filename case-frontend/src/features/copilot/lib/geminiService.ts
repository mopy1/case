import type { AdrSuggestion, CopilotSection, EntitySuggestion, RelationSuggestion } from "../types/copilot.types"
import type { EntidadDiagramaResponse, RelacionDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { findSafeEntityPosition } from "@/features/diagram/lib/positionGuide"
import { generateLocalResponse, KNOWLEDGE_TOPICS } from "./copilotKnowledge"
import { cleanResponseText, parseAdrFromText, parseEntitySuggestions, parseRelationSuggestions } from "./copilotParsers"

export interface AskCopilotResult {
  text: string
  adrSuggestion?: AdrSuggestion
  entitySuggestions?: EntitySuggestion[]
  relationSuggestions?: RelationSuggestion[]
}

function buildSystemContext(
  section: CopilotSection,
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] }
): string {
  const existingEntities = diagram?.entidades ?? []
  const safePos = findSafeEntityPosition(existingEntities)
  const tablesList = existingEntities.length
    ? existingEntities.map((e) => `- ${e.nombre} (x:${e.posX}, y:${e.posY})`).join("\n")
    : "Sin tablas en el lienzo."

  return `Eres el Asistente Experto (Copilot y Manual de Usuario) de Collaborative CASE Tool.
Sección actual: "${section}".
Tablas actuales en el lienzo:
${tablesList}

GUÍA DE POSICIONAMIENTO DE TABLAS:
Las tablas miden 270px ancho x 220px alto. Para que NO SE CHOCEN, deben separarse por al menos 70px en X y 60px en Y.
Próxima posición libre recomendada: x: ${safePos.posX}, y: ${safePos.posY}.

REGLAS DE RESPUESTA:
1. BREVEDAD: Responde en 1 a 2 oraciones (menos de 40 palabras).
2. ACCIONES EN EL LIENZO: El sistema puede crear tablas y relaciones directamente.
- Para crear tablas, añade al final:
CREAR_TABLA: [Nombre] (x: ${safePos.posX}, y: ${safePos.posY})
ATRIBUTOS: [id:BIGINT:PK, campo1:VARCHAR, campo2:INTEGER]
- Para relaciones, añade al final:
CREAR_RELACION: [Origen] -> [Destino] (UNO_O_MAS a UNO)
- Para notas ADR:
ADR_SUGERIDA: [Acción]
MOTIVO: [Justificación técnica]

Base de conocimiento:
${KNOWLEDGE_TOPICS.map((t) => `- ${t.title}: ${t.summary}`).join("\n")}`
}

export async function askCopilot(
  query: string,
  section: CopilotSection,
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] }
): Promise<AskCopilotResult> {
  const deepseekKey =
    import.meta.env.VITE_DEEPSEEK_API_KEY ||
    (import.meta.env as unknown as Record<string, string>)["VITE_DEEPSEEk_API_KEY"]
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
  const existingEntities = diagram?.entidades ?? []

  if (!deepseekKey && !geminiKey) {
    return generateLocalResponse(query, section, existingEntities)
  }

  const systemContext = buildSystemContext(section, diagram)

  if (deepseekKey && typeof deepseekKey === "string" && deepseekKey.trim()) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey.trim()}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "system", content: systemContext }, { role: "user", content: query }],
          temperature: 0.5,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const rawText = data.choices?.[0]?.message?.content
        if (rawText) {
          return {
            text: cleanResponseText(rawText) || rawText,
            adrSuggestion: parseAdrFromText(rawText),
            entitySuggestions: parseEntitySuggestions(rawText, existingEntities),
            relationSuggestions: parseRelationSuggestions(rawText),
          }
        }
      }
    } catch {
      // fallback
    }
  }

  if (geminiKey && typeof geminiKey === "string" && geminiKey.trim()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: systemContext }] },
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          return {
            text: cleanResponseText(rawText) || rawText,
            adrSuggestion: parseAdrFromText(rawText),
            entitySuggestions: parseEntitySuggestions(rawText, existingEntities),
            relationSuggestions: parseRelationSuggestions(rawText),
          }
        }
      }
    } catch {
      // fallback
    }
  }

  return generateLocalResponse(query, section, existingEntities)
}
