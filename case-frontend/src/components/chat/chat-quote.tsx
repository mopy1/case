import { CornerDownRight } from "lucide-react"

const MAX_CARACTERES = 70

export interface ChatQuoteProps {
  /** undefined → "En respuesta a un mensaje anterior". */
  author?: string
  excerpt?: string
}

/** Cita compacta del mensaje al que se responde. */
export function ChatQuote({ author, excerpt }: ChatQuoteProps) {
  const texto = excerpt && excerpt.length > MAX_CARACTERES ? `${excerpt.slice(0, MAX_CARACTERES)}…` : excerpt

  return (
    <div className="flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
      <CornerDownRight className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">
        {author ? (
          <>
            <span className="font-medium text-foreground">@{author}</span>: {texto}
          </>
        ) : (
          "En respuesta a un mensaje anterior"
        )}
      </span>
    </div>
  )
}
