import type { NotaRequest } from "@/features/notes"
import type { ChatMensaje } from "../types/chat.types"

const MAX_ACCION = 100
const MAX_MOTIVO = 2000

/** Quita la sintaxis Markdown más común para que la acción sea texto plano. */
function sinMarkdown(texto: string): string {
  return texto
    .replace(/```[\s\S]*?```/g, " ")
    // Negrita, código y cursiva; un `*` suelto ("0..*") se conserva.
    .replace(/\*\*|`+/g, "")
    .replace(/(^|\s)\*([^*\s][^*\n]*?)\*(?=[\s.,;:!?]|$)/gm, "$1$2")
    .replace(/^[ \t]*>[ \t]?/gm, "")
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*(?:[-•]|\d+\.)[ \t]+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
}

function recortar(texto: string, max: number): string {
  return texto.length <= max ? texto : `${texto.slice(0, max - 1).trimEnd()}…`
}

/** Borrador editable de ADR desde una respuesta de Senior Dev: 1.ª oración como acción y la respuesta como motivo. */
export function borradorAdr(mensaje: Pick<ChatMensaje, "id">, textoLimpio: string): NotaRequest {
  // 1.er párrafo útil (no una intro que termina en ":") y su 1.ª oración, sin cortar en "1." de una lista.
  const parrafos = sinMarkdown(textoLimpio)
    .replace(/^\s*@\w+[,:]?\s*/, "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
  const parrafo = parrafos.find((p) => p.length >= 12 && !p.endsWith(":")) ?? parrafos[0] ?? ""
  const oracion = (parrafo.match(/^.+?(?<!\d)[.!?](?=\s|$)/)?.[0] ?? parrafo).trim()
  const primeraOracion = oracion.charAt(0).toUpperCase() + oracion.slice(1)
  const origen = `\n\nOrigen: chat #${mensaje.id} (Senior Dev)`
  return {
    accion: recortar(primeraOracion, MAX_ACCION),
    motivo: recortar(sinMarkdown(textoLimpio).replace(/\n{3,}/g, "\n\n").trim(), MAX_MOTIVO - origen.length) + origen,
  }
}
