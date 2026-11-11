import { executeMoveTables } from "./copilotMoveAction"
import { createNote } from "@/features/notes/api/notesApi"
import type { CopilotMessage } from "../types/copilot.types"
import {
  executeAddAttribute,
  executeCreateEntity,
  executeCreateRelation,
  executeDeleteEntityByName,
} from "./copilotDiagramActions"
import {
  executeCreateTaskAction,
  executeDeleteRelationByName,
  executeExportXmiAction,
  executeGenerateBackendAction,
} from "./copilotSystemActions"

export async function executeAllMessageChanges(
  proyectoId: number,
  message: CopilotMessage
): Promise<void> {
  // 1. Eliminar relaciones previas
  if (message.relationDeleteSuggestions) {
    for (const r of message.relationDeleteSuggestions) {
      if (!r.eliminada) {
        await executeDeleteRelationByName(proyectoId, r.origen, r.destino).catch(console.error)
      }
    }
  }

  // 2. Eliminar tablas innecesarias
  if (message.entityDeleteSuggestions) {
    for (const d of message.entityDeleteSuggestions) {
      if (!d.eliminada) {
        await executeDeleteEntityByName(proyectoId, d.tabla).catch(console.error)
      }
    }
  }

  // 3. Crear tablas
  if (message.entitySuggestions) {
    for (const e of message.entitySuggestions) {
      if (!e.creada) {
        await executeCreateEntity(proyectoId, e).catch(console.error)
      }
    }
  }

  // 4. Crear relaciones (1:N, N:M; una N:M genera sola su tabla intermedia "a_b")
  if (message.relationSuggestions) {
    for (const r of message.relationSuggestions) {
      if (!r.creada) {
        await executeCreateRelation(proyectoId, r).catch(console.error)
      }
    }
  }

  // 5. Agregar atributos DESPUÉS de las relaciones: así la IA puede agregarle columnas a la tabla
  //    intermedia que acaba de generar la N:M (AGREGAR_ATRIBUTO: [a_b] ...) en la misma respuesta.
  if (message.attributeSuggestions) {
    for (const a of message.attributeSuggestions) {
      if (!a.creada) {
        await executeAddAttribute(proyectoId, a).catch(console.error)
      }
    }
  }

  // 6. Crear tareas Kanban
  if (message.taskSuggestions) {
    for (const t of message.taskSuggestions) {
      if (!t.creada) {
        await executeCreateTaskAction(proyectoId, t).catch(console.error)
      }
    }
  }

  // 7. Guardar notas ADR
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

  // 8. Acciones de sistema (exportar / generar backend)
  if (message.systemActions) {
    for (const s of message.systemActions) {
      if (!s.ejecutada) {
        if (s.tipo === "EXPORTAR_XMI") {
          await executeExportXmiAction(proyectoId).catch(console.error)
        } else if (s.tipo === "GENERAR_BACKEND") {
          await executeGenerateBackendAction(proyectoId).catch(console.error)
        } else if (s.tipo === "MOVER_TABLAS" && s.movimientos) {
          // Al final: así también puede ubicar tablas recién creadas y las intermedias generadas solas.
          await executeMoveTables(proyectoId, s.movimientos).catch(console.error)
        }
      }
    }
  }

  window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId } }))
  window.dispatchEvent(new CustomEvent("project:note-created", { detail: { proyectoId } }))
  window.dispatchEvent(new CustomEvent("project:task-created", { detail: { proyectoId } }))
}
