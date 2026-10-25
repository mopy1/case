interface ChatMessageContentProps {
  contenido: string
}

const TOKEN_REGEX = /(`[^`\n]+`|@[a-zA-Z0-9_]+)/g

/** Formatea texto del chat: resalta menciones @SeniorDev / @usuario y bloques de código inline. */
export function ChatMessageContent({ contenido }: ChatMessageContentProps) {
  const partes = contenido.split(TOKEN_REGEX)

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {partes.map((parte, index) => {
        if (!parte) return null

        if (parte.startsWith("`") && parte.endsWith("`") && parte.length >= 2) {
          return (
            <code
              key={index}
              className="mx-0.5 rounded border border-border/60 bg-muted/70 px-1 py-0.5 font-mono text-[11px] text-foreground"
            >
              {parte.slice(1, -1)}
            </code>
          )
        }

        if (parte.startsWith("@")) {
          const esSeniorDev = parte.toLowerCase() === "@seniordev"
          return (
            <span
              key={index}
              className={
                esSeniorDev
                  ? "inline-flex items-center rounded-sm bg-primary/15 px-1 py-0.2 font-semibold text-primary"
                  : "font-semibold text-primary/90"
              }
            >
              {parte}
            </span>
          )
        }

        return parte
      })}
    </span>
  )
}
