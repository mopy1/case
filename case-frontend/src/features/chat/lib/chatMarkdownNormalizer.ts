/**
 * Normaliza el espaciado en respuestas Markdown:
 * 1. Protege bloques de código delimitados por ``` para no alterar su contenido.
 * 2. Compacta listas consecutivas separadas por líneas en blanco a un solo salto simple.
 * 3. Expande puntos y aparte con salto simple a doble salto (\n\n) para párrafos aireados.
 */
export function normalizeMarkdownSpacing(raw: string): string {
  if (!raw) return ""

  const codeBlockRegex = /(```[\s\S]*?```)/g
  const parts = raw.split(codeBlockRegex)

  return parts
    .map((part) => {
      if (part.startsWith("```")) return part

      let text = part.replace(/\r\n/g, "\n")

      // 1. Compactar listas consecutivas separadas por líneas en blanco
      let prevText = ""
      while (prevText !== text) {
        prevText = text
        text = text.replace(
          /(^|\n)([ \t]*(?:[-*•+]|\d+\.)[^\n]+)\n\n+([ \t]*(?:[-*•+]|\d+\.))/g,
          "$1$2\n$3"
        )
      }

      // 2. Expandir punto y aparte con un solo salto a doble salto si sigue texto ordinario
      text = text.replace(/([.?!:])\n(?=[A-Z¿¡ÁÉÍÓÚa-z0-9])/g, "$1\n\n")

      return text
    })
    .join("")
}
