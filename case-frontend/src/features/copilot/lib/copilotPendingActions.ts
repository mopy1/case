import type { CopilotMessage } from "../types/copilot.types"

/** Cuántas sugerencias de un mensaje del asistente siguen sin aplicar (para el botón "Aplicar todos"). */
export function countPendingActions(message: CopilotMessage): number {
  let count = 0
  if (message.relationDeleteSuggestions) {
    count += message.relationDeleteSuggestions.filter((r) => !r.eliminada).length
  }
  if (message.entityDeleteSuggestions) {
    count += message.entityDeleteSuggestions.filter((d) => !d.eliminada).length
  }
  if (message.entitySuggestions) {
    count += message.entitySuggestions.filter((e) => !e.creada).length
  }
  if (message.attributeSuggestions) {
    count += message.attributeSuggestions.filter((a) => !a.creada).length
  }
  if (message.relationSuggestions) {
    count += message.relationSuggestions.filter((r) => !r.creada).length
  }
  if (message.taskSuggestions) {
    count += message.taskSuggestions.filter((t) => !t.creada).length
  }
  if (message.systemActions) {
    count += message.systemActions.filter((s) => !s.ejecutada).length
  }
  if (message.adrSuggestions) {
    count += message.adrSuggestions.filter((a) => !a.guardada).length
  } else if (message.adrSuggestion && !message.adrSuggestion.guardada) {
    count += 1
  }
  return count
}

/** true si el mensaje trajo al menos una sugerencia accionable (aplicada o no). */
export function hasAnyActions(message: CopilotMessage): boolean {
  return !!(
    (message.relationDeleteSuggestions && message.relationDeleteSuggestions.length > 0) ||
    (message.entityDeleteSuggestions && message.entityDeleteSuggestions.length > 0) ||
    (message.entitySuggestions && message.entitySuggestions.length > 0) ||
    (message.attributeSuggestions && message.attributeSuggestions.length > 0) ||
    (message.relationSuggestions && message.relationSuggestions.length > 0) ||
    (message.taskSuggestions && message.taskSuggestions.length > 0) ||
    (message.systemActions && message.systemActions.length > 0) ||
    (message.adrSuggestions && message.adrSuggestions.length > 0) ||
    message.adrSuggestion
  )
}
