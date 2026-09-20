import { createNote } from "@/features/notes/api/notesApi"
import type { CopilotMessage } from "../types/copilot.types"
import {
  executeAddAttribute,
  executeCreateEntity,
  executeCreateRelation,
  executeDeleteEntityByName,
} from "./copilotDiagramActions"

export async function executeAllMessageChanges(
  proyectoId: number,
  message: CopilotMessage
): Promise<void> {
  if (message.entityDeleteSuggestions) {
    for (const d of message.entityDeleteSuggestions) {
      if (!d.eliminada) {
        await executeDeleteEntityByName(proyectoId, d.tabla).catch(console.error)
      }
    }
  }

  if (message.entitySuggestions) {
    for (const e of message.entitySuggestions) {
      if (!e.creada) {
        await executeCreateEntity(proyectoId, e).catch(console.error)
      }
    }
  }

  if (message.attributeSuggestions) {
    for (const a of message.attributeSuggestions) {
      if (!a.creada) {
        await executeAddAttribute(proyectoId, a).catch(console.error)
      }
    }
  }

  if (message.relationSuggestions) {
    for (const r of message.relationSuggestions) {
      if (!r.creada) {
        await executeCreateRelation(proyectoId, r).catch(console.error)
      }
    }
  }

  const notesToSave = [
    ...(message.adrSuggestions?.filter((a) => !a.guardada) ?? []),
    ...(message.adrSuggestion &&
    !message.adrSuggestion.guardada &&
    (!message.adrSuggestions || message.adrSuggestions.length === 0)
      ? [message.adrSuggestion]
      : []),
  ]

  for (const n of notesToSave) {
    await createNote(proyectoId, { accion: n.accion, motivo: n.motivo }).catch(console.error)
  }

  window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId } }))
  window.dispatchEvent(new CustomEvent("project:note-created", { detail: { proyectoId } }))
}
