import type {
  AdrSuggestion,
  AttributeSuggestion,
  CopilotSection,
  EntityDeleteSuggestion,
  EntitySuggestion,
  RelationDeleteSuggestion,
  RelationSuggestion,
  SystemActionSuggestion,
  TaskSuggestion,
} from "../types/copilot.types"
import type { EntidadDiagramaResponse, RelacionDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { generateLocalResponse } from "./copilotKnowledge"
import {
  cleanResponseText,
  parseAdrListFromText,
  parseAttributeSuggestions,
  parseEntityDeleteSuggestions,
  parseEntitySuggestions,
  parseRelationDeleteSuggestions,
  parseRelationSuggestions,
  parseSystemActionSuggestions,
  parseTaskSuggestions,
} from "./copilotParsers"
import { buildSystemContext } from "./copilotSystemPrompt"

export interface AskCopilotResult {
  text: string
  adrSuggestion?: AdrSuggestion
  adrSuggestions?: AdrSuggestion[]
  entitySuggestions?: EntitySuggestion[]
  relationSuggestions?: RelationSuggestion[]
  relationDeleteSuggestions?: RelationDeleteSuggestion[]
  attributeSuggestions?: AttributeSuggestion[]
  entityDeleteSuggestions?: EntityDeleteSuggestion[]
  taskSuggestions?: TaskSuggestion[]
  systemActions?: SystemActionSuggestion[]
}

function processAssistantResponse(
  rawText: string,
  existingEntities: EntidadDiagramaResponse[],
  userQuery = ""
): AskCopilotResult {
  const adrList = parseAdrListFromText(rawText)
  const userWantsDelete = /\b(?:eliminar|borrar|quitar|remover|delete|drop)\b/i.test(userQuery)
  const entityDeleteSuggestions = userWantsDelete ? parseEntityDeleteSuggestions(rawText) : []

  return {
    text: cleanResponseText(rawText) || rawText,
    adrSuggestion: adrList[0],
    adrSuggestions: adrList,
    entitySuggestions: parseEntitySuggestions(rawText, existingEntities),
    relationSuggestions: parseRelationSuggestions(rawText),
    relationDeleteSuggestions: parseRelationDeleteSuggestions(rawText),
    attributeSuggestions: parseAttributeSuggestions(rawText),
    entityDeleteSuggestions,
    taskSuggestions: parseTaskSuggestions(rawText),
    systemActions: parseSystemActionSuggestions(rawText),
  }
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
          temperature: 0.3,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const rawText = data.choices?.[0]?.message?.content
        if (rawText) {
          return processAssistantResponse(rawText, existingEntities, query)
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
          return processAssistantResponse(rawText, existingEntities, query)
        }
      }
    } catch {
      // fallback
    }
  }

  return generateLocalResponse(query, section, existingEntities)
}
