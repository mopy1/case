import type { ReactNode } from "react"

const INLINE_REGEX = /(`[^`\n]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|@[a-zA-Z0-9_-]+)/g

/**
 * Parsea formato inline: negrita (**), cursiva (*), código (`), @SeniorDev y mención propia @miUsuario.
 */
export function renderMarkdownInline(text: string, currentUsername?: string): ReactNode {
  if (!text) return null
  const parts = text.split(INLINE_REGEX)

  return parts.map((part, index) => {
    if (!part) return null

    // 1. Código inline
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const code = part.slice(1, -1).trim()
      if (!code || code === "`") return null
      return (
        <code key={index} className="rounded-md bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {code}
        </code>
      )
    }

    // 2. Negrita
    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }

    // 3. Cursiva
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }

    // 4. Menciones: la propia en tono "mention"; el resto (incluido @SeniorDev) en primario suave
    if (part.startsWith("@")) {
      const esPropia = Boolean(currentUsername && part.slice(1).toLowerCase() === currentUsername.toLowerCase())
      return (
        <span
          key={index}
          className={esPropia ? "rounded-sm bg-mention/20 px-1 font-medium text-foreground" : "rounded-sm bg-primary/10 px-1 font-medium text-primary"}
        >
          {part}
        </span>
      )
    }

    return part
  })
}
