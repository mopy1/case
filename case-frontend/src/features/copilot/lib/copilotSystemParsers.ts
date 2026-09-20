import type { Prioridad } from "@/features/tasks/types/tasks.type"
import type { CopilotSection, RelationDeleteSuggestion, SystemActionSuggestion, TaskSuggestion } from "../types/copilot.types"

export function parseRelationDeleteSuggestions(text: string): RelationDeleteSuggestion[] {
  const results: RelationDeleteSuggestion[] = []
  const regex = /(?:ELIMINAR_RELACION|BORRAR_RELACION):\s*\[?([a-zA-Z0-9_]+)\]?\s*(?:->|-|a)\s*\[?([a-zA-Z0-9_]+)\]?/gi
  const matches = [...text.matchAll(regex)]

  for (const m of matches) {
    const origen = m[1].trim()
    const destino = m[2].trim()
    if (origen && destino) {
      results.push({ origen, destino, eliminada: false })
    }
  }

  return results
}

export function parseTaskSuggestions(text: string): TaskSuggestion[] {
  const results: TaskSuggestion[] = []
  const regex = /(?:CREAR_TAREA|AGREGAR_TAREA):\s*\[?([^\]|\n]+?)\]?\s*(?:\||-)\s*\[?([^\]|\n]+?)\]?(?:\s*(?:\||-)\s*\[?(ALTA|MEDIA|BAJA)\]?)?/gi
  const matches = [...text.matchAll(regex)]

  for (const m of matches) {
    const titulo = m[1]?.trim().replace(/^\[|\]$/g, "")
    const descripcion = m[2]?.trim().replace(/^\[|\]$/g, "")
    const rawPrio = (m[3]?.trim().toUpperCase() || "MEDIA") as Prioridad
    const prioridad: Prioridad = rawPrio === "ALTA" || rawPrio === "BAJA" ? rawPrio : "MEDIA"

    if (titulo && descripcion) {
      results.push({ titulo, descripcion, prioridad, creada: false })
    }
  }

  return results
}

export function parseSystemActionSuggestions(text: string): SystemActionSuggestion[] {
  const results: SystemActionSuggestion[] = []

  if (/\b(?:EXPORTAR_XMI|DESCARGAR_XMI)\b/i.test(text)) {
    results.push({
      tipo: "EXPORTAR_XMI",
      label: "Descargar modelo XMI para Enterprise Architect",
      ejecutada: false,
    })
  }

  if (/\b(?:GENERAR_BACKEND|DESCARGAR_BACKEND)\b/i.test(text)) {
    results.push({
      tipo: "GENERAR_BACKEND",
      label: "Generar y Descargar Backend Spring Boot (.ZIP)",
      ejecutada: false,
    })
  }

  const navMatch = text.match(/\bIR_A:\s*\[?(diagrama|tareas|notas|xmi|generador)\]?/i)
  if (navMatch) {
    const destino = navMatch[1].toLowerCase() as CopilotSection
    results.push({
      tipo: "NAVEGAR",
      label: `Navegar a la sección de ${destino}`,
      destino,
      ejecutada: false,
    })
  }

  return results
}
