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
import { askGeminiVision } from "./geminiVisionService"
import type { ProcessedImage } from "./copilotImageUtils"

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
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] },
  image?: ProcessedImage
): Promise<AskCopilotResult> {
  const existingEntities = diagram?.entidades ?? []

  // 1. Si el usuario adjuntó una foto: USAR EXCLUSIVAMENTE GOOGLE GEMINI (Visión)
  if (image) {
    try {
      const visionRawText = await askGeminiVision(query, image, diagram)
      return processAssistantResponse(visionRawText, existingEntities, query)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error al procesar la imagen con Google Gemini."
      return {
        text: `⚠️ **Error de Reconocimiento Visual (Gemini):** ${errorMsg}\n\nAsegúrate de que la foto esté bien iluminada y las tablas/relaciones sean legibles.`,
      }
    }
  }

  // 2. Para texto/escritura: USAR EXCLUSIVAMENTE DEEPSEEK (Ahorro de tokens de Google)
  const deepseekKey =
    import.meta.env.VITE_DEEPSEEK_API_KEY ||
    (import.meta.env as unknown as Record<string, string>)["VITE_DEEPSEEk_API_KEY"]

  if (deepseekKey && typeof deepseekKey === "string" && deepseekKey.trim()) {
    try {
      const systemContext = buildSystemContext(section, diagram)
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
      // Fallback a motor local si no hay conexión
    }
  }

  // 3. Fallback a conocimiento local si no hay API de DeepSeek disponible
  return generateLocalResponse(query, section, existingEntities)
}
