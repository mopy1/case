import type { ReactNode } from "react"
import { Sparkles } from "lucide-react"

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
        <code
          key={index}
          className="mx-0.5 rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-[11px] text-foreground"
        >
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
        <strong key={index} className="font-semibold text-foreground">
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
        <em key={index} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      )
    }

    // 4. Menciones
    if (part.startsWith("@")) {
      const tag = part.slice(1).toLowerCase()
      const esSeniorDev = tag === "seniordev"
      const esPropia = Boolean(currentUsername && tag === currentUsername.toLowerCase())

      if (esSeniorDev) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-0.5 rounded-sm border border-primary/25 bg-primary/15 px-1 py-0.5 font-semibold text-[11px] text-primary"
          >
            <Sparkles className="size-2.5" />
            {part}
          </span>
        )
      }

      if (esPropia) {
        return (
          <span
            key={index}
            className="inline-flex items-center gap-0.5 rounded-sm border border-amber-500/40 bg-amber-500/25 px-1 py-0.5 font-semibold text-[11px] text-amber-800 dark:text-amber-200 shadow-xs"
          >
            {part}
          </span>
        )
      }

      return (
        <span
          key={index}
          className="rounded-sm bg-muted/60 px-1 py-0.5 font-semibold text-[11px] text-primary/90"
        >
          {part}
        </span>
      )
    }

    return part
  })
}
