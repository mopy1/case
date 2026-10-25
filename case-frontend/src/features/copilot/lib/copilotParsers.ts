import type { AdrSuggestion } from "../types/copilot.types"

export { parseLadoMultiplicidad, parseTipoRelacionUml } from "./copilotUmlParsers"

export {
  parseEntitySuggestions,
  parseRelationSuggestions,
  parseAttributeSuggestions,
  parseEntityDeleteSuggestions,
} from "./copilotDiagramParsers"

export {
  parseRelationDeleteSuggestions,
  parseTaskSuggestions,
  parseSystemActionSuggestions,
} from "./copilotSystemParsers"

export function parseAdrListFromText(text: string): AdrSuggestion[] {
  const results: AdrSuggestion[] = []
  const regex = /(?:ADR_SUGERIDA|Acci[oó]n):\s*\[?([^\]\n]+?)(?:\s+MOTIVO:|\s*\n+[\s•\-*]*(?:MOTIVO|Motivo(?: T[eé]cnico)?):?)\s*\[?([^\]\n]+)\]?/gi
  const matches = [...text.matchAll(regex)]

  for (const m of matches) {
    const accion = m[1].trim().replace(/^\[|\]$/g, "")
    const motivo = m[2].trim().replace(/^\[|\]$/g, "")
    if (accion && motivo) {
      results.push({ accion, motivo, guardada: false })
    }
  }

  return results
}

export function cleanResponseText(rawText: string): string {
  const sinComandos = rawText
    .replace(/(?:##\s*ADR:?[\s\S]*$)/i, "")
    .replace(/(?:\*{0,2})ADR_SUGERIDA:?[^\n]+(?:\n+(?:\*{0,2})MOTIVO:?[^\n]+)?/gi, "")
    .replace(/(?:\*{0,2})CREAR_TABLA:?[^\n]+(?:\n+(?:\*{0,2})ATRIBUTOS:?[^\n]+)?/gi, "")
    .replace(/(?:\*{0,2})(?:CREAR_RELACION|ACTUALIZAR_RELACION):?[^\n]+/gi, "")
    .replace(/(?:\*{0,2})(?:ELIMINAR_RELACION|BORRAR_RELACION):?[^\n]+/gi, "")
    .replace(/(?:\*{0,2})(?:AGREGAR_ATRIBUTO|CREAR_ATRIBUTO):?[^\n]+/gi, "")
    .replace(/(?:\*{0,2})(?:ELIMINAR_TABLA|BORRAR_TABLA):?[^\n]+/gi, "")
    .replace(/(?:\*{0,2})(?:CREAR_TAREA|AGREGAR_TAREA):?[^\n]+/gi, "")
    .replace(/(?:\*{0,2})(?:EXPORTAR_XMI|DESCARGAR_XMI|GENERAR_BACKEND|DESCARGAR_BACKEND):?[^\n]*/gi, "")
    .replace(/(?:\*{0,2})IR_A:?[^\n]+/gi, "")
    .replace(/(?:\*{0,2})Acci[oó]n:?[^\n]+(?:\n+(?:\*{0,2})Motivo:?[^\n]+)?/gi, "")
    .replace(/##\s*⚠️\s*Aclaración importante[\s\S]*$/i, "")
    // Elimina bloques de código vacíos o fences huérfanos dejados tras extraer los comandos
    .replace(/```[a-zA-Z0-9_-]*\s*```/g, "")
    .replace(/^```[a-zA-Z0-9_-]*\s*$/gm, "")
    .replace(/^`+\s*$/gm, "")
    .replace(/`\s*`/g, "")

  // Cada línea de comando removida arriba deja su(s) salto(s) de línea intactos — con varias
  // tablas/relaciones seguidas eso deja una racha larga de líneas en blanco que
  // `renderFormattedContent` dibuja como un espaciador por línea, un hueco enorme en la burbuja.
  // Se recorta cada línea y se colapsa cualquier racha de 2+ saltos a una sola línea en blanco.
  return sinComandos
    .split("\n")
    .map((linea) => linea.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
