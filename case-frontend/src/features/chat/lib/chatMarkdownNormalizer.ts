/**
 * Normaliza el espaciado en respuestas Markdown:
 * 1. Protege bloques de código delimitados por ``` para no alterar su formato interno.
 * 2. Garantiza doble salto de línea (\n\n) en puntos y aparte (. ? ! :) para párrafos aireados.
 * 3. Mantiene las listas (con viñetas o numeradas) compactas con salto simple (\n).
 */
export function normalizeMarkdownSpacing(raw: string): string {
  if (!raw) return ""

  const codeBlockRegex = /(```[\s\S]*?```)/g
  const parts = raw.split(codeBlockRegex)

  return parts
    .map((part) => {
      if (part.startsWith("```")) return part

      const lines = part.replace(/\r\n/g, "\n").split("\n")
      const result: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmed = line.trim()
        const isList = /^\s*(?:[-*•+]|\d+\.)\s+/.test(line)

        result.push(line)

        if (i < lines.length - 1) {
          const nextLine = lines[i + 1]
          const nextTrimmed = nextLine.trim()
          const nextIsList = /^\s*(?:[-*•+]|\d+\.)\s+/.test(nextLine)

          // Si termina en puntuación (. ? ! :) y la siguiente línea tiene contenido
          // y ninguna es un ítem de lista: insertar salto adicional (\n\n)
          const endsWithPunct = /[.?!:]\s*$/.test(trimmed)
          if (endsWithPunct && nextTrimmed !== "" && !isList && !nextIsList) {
            result.push("")
          }
        }
      }

      return result.join("\n")
    })
    .join("")
}
