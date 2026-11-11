export interface TextoSeparado {
  /** Cadena de pensamiento del modelo (null si no hay). */
  razonamiento: string | null
  /** Respuesta final, sin bloques `<think>`: es lo único que se parsea (comandos, citas, ADR, copiar). */
  respuesta: string
}

const BLOQUE = /<think>([\s\S]*?)<\/think>/gi
const ABIERTO = /<think>([\s\S]*)$/i
const SOLO_CIERRE = /^([\s\S]*?)<\/think>/i

/**
 * Separa el razonamiento de la respuesta. Usa el campo `razonamiento` del backend y además extrae del texto
 * los bloques `<think>…</think>`, un `<think>` sin cerrar (respuesta cortada) o un `</think>` sin apertura
 * (plantillas de Qwen que abren la etiqueta en el prompt), por si el backend no los separó.
 */
export function separarRazonamiento(texto: string, razonamiento?: string | null): TextoSeparado {
  const partes: string[] = razonamiento?.trim() ? [razonamiento.trim()] : []
  let resto = texto

  if (!/<think>/i.test(resto)) {
    const cierre = SOLO_CIERRE.exec(resto)
    if (cierre) {
      partes.push(cierre[1].trim())
      resto = resto.slice(cierre[0].length)
    }
  }
  resto = resto.replace(BLOQUE, (_, interno: string) => {
    partes.push(interno.trim())
    return ""
  })
  const abierto = ABIERTO.exec(resto)
  if (abierto) {
    partes.push(abierto[1].trim())
    resto = resto.slice(0, abierto.index)
  }

  const unido = partes.filter(Boolean).join("\n\n")
  return { razonamiento: unido || null, respuesta: resto.trim() }
}
