import type { ChatMensaje } from "../types/chat.types"
import type { ChatProposal, ChatProposalSummary } from "../types/chat-proposal.types"
import type { CopilotMessage } from "@/features/copilot/types/copilot.types"
import { cleanResponseText, parseAdrListFromText } from "@/features/copilot/lib/copilotParsers"
import {
  parseAttributeSuggestions,
  parseEntityDeleteSuggestions,
  parseEntitySuggestions,
  parseRelationSuggestions,
} from "@/features/copilot/lib/copilotDiagramParsers"
import {
  parseRelationDeleteSuggestions,
  parseSystemActionSuggestions,
  parseTaskSuggestions,
} from "@/features/copilot/lib/copilotSystemParsers"

export function parseChatProposal(
  input: ChatMensaje | string | null | undefined,
  context?: { messageId?: number; proyectoId?: number; createdAt?: string }
): ChatProposal | null {
  if (!input) return null

  const isMsg = typeof input !== "string"
  if (isMsg && (input.tipo !== "IA" || !input.contenido)) return null

  const raw = isMsg ? input.contenido : input
  const messageId = isMsg ? input.id : (context?.messageId ?? 0)
  const proyectoId = isMsg ? input.proyectoId : (context?.proyectoId ?? 0)
  const createdAt = isMsg ? input.createdAt : (context?.createdAt ?? new Date().toISOString())

  const entitySuggestions = parseEntitySuggestions(raw, [])
  const attributeSuggestions = parseAttributeSuggestions(raw)
  const relationSuggestions = parseRelationSuggestions(raw)
  const entityDeleteSuggestions = parseEntityDeleteSuggestions(raw)
  const relationDeleteSuggestions = parseRelationDeleteSuggestions(raw)
  const taskSuggestions = parseTaskSuggestions(raw)
  const adrSuggestions = parseAdrListFromText(raw)
  const systemActions = parseSystemActionSuggestions(raw)

  const counts = [
    entitySuggestions.length,
    entityDeleteSuggestions.length,
    attributeSuggestions.length,
    relationSuggestions.length,
    relationDeleteSuggestions.length,
    taskSuggestions.length,
    adrSuggestions.length,
    systemActions.length,
  ]
  const total = counts.reduce((acc, c) => acc + c, 0)
  if (total === 0) return null

  const summary: ChatProposalSummary = {
    tablasNuevas: counts[0],
    tablasEliminadas: counts[1],
    atributosNuevos: counts[2],
    relacionesNuevas: counts[3],
    relacionesEliminadas: counts[4],
    tareasNuevas: counts[5],
    adrsNuevas: counts[6],
    accionesSistema: counts[7],
    total,
  }

  const detalles: string[] = [
    ...entitySuggestions.map((e) => `Tabla nueva: ${e.nombre} (${e.atributos?.length ?? 1} campos)`),
    ...attributeSuggestions.map((a) => `Atributo para ${a.tabla}: +${a.nombre} (${a.tipoSql})`),
    ...relationSuggestions.map((r) => `Relación: ${r.origen} -> ${r.destino}`),
    ...relationDeleteSuggestions.map((r) => `Eliminar relación: ${r.origen} -> ${r.destino}`),
    ...entityDeleteSuggestions.map((e) => `Eliminar tabla: ${e.tabla}`),
    ...taskSuggestions.map((t) => `Tarea Kanban: ${t.titulo}`),
    ...adrSuggestions.map((a) => `Nota ADR: ${a.accion}`),
    ...systemActions.map((s) => s.label),
  ]

  const textoLimpio = cleanResponseText(raw) || raw

  const copilotMessage: CopilotMessage = {
    id: `chat-${messageId}`,
    sender: "assistant",
    text: textoLimpio,
    timestamp: createdAt,
    entitySuggestions,
    attributeSuggestions,
    relationSuggestions,
    relationDeleteSuggestions,
    entityDeleteSuggestions,
    taskSuggestions,
    adrSuggestions,
    systemActions,
  }

  return { messageId, proyectoId, textoLimpio, summary, totalCambios: total, detalles, copilotMessage }
}
