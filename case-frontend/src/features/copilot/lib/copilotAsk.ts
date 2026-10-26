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
import { mensajeDeError } from "@/lib/api"
import { consultarCopilot } from "../api/copilotApi"
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

/** Mismo tope que `@Size` del backend (≈ 1,5 MB de imagen). */
const IMAGEN_BASE64_MAX = 2_000_000

function processAssistantResponse(
  rawText: string,
  existingEntities: EntidadDiagramaResponse[],
  userQuery = ""
): AskCopilotResult {
  const adrList = parseAdrListFromText(rawText)
  const userWantsDelete = /\b(?:eliminar|borrar|quitar|remover|delete|drop)\b/i.test(userQuery)
  const entityDeleteSuggestions = userWantsDelete ? parseEntityDeleteSuggestions(rawText) : []

  const result = {
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
  // Si el modelo solo mandó comandos (a veces dentro de un bloque ```), no se muestra el texto crudo.
  const hayTarjetas = Object.values(result).some((v) => Array.isArray(v) && v.length > 0)
  const limpio = cleanResponseText(rawText)
  return { ...result, text: limpio || (hayTarjetas ? "Te preparé estas propuestas para aplicar:" : rawText) }
}

/** Modo Asistente: el backend arma el prompt con el diagrama y llama a DeepSeek (texto) o Gemini (foto). */
export async function askCopilot(
  proyectoId: number,
  query: string,
  section: CopilotSection,
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] },
  image?: ProcessedImage
): Promise<AskCopilotResult> {
  if (image && image.base64Data.length > IMAGEN_BASE64_MAX) {
    return { text: "**Error del Copilot:** La imagen supera el tamaño máximo (1,5 MB). Probá con una foto más chica." }
  }
  try {
    const res = await consultarCopilot(proyectoId, {
      texto: query,
      imagenBase64: image?.base64Data,
      seccion: section,
      modo: "ASISTENTE",
    })
    return processAssistantResponse(res.texto, diagram?.entidades ?? [], query)
  } catch (err) {
    return { text: `**Error del Copilot:** ${mensajeDeError(err)}` }
  }
}
