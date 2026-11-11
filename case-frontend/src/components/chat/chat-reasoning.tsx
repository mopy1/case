import { useId, useState } from "react"
import { Brain, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChatReasoningProps {
  text: string
  /** Por defecto colapsado: el razonamiento es largo y secundario. */
  defaultOpen?: boolean
  className?: string
}

/** Acordeón "Proceso de Razonamiento Arquitectónico": se pinta arriba de la respuesta final y de las tarjetas. */
export function ChatReasoning({ text, defaultOpen = false, className }: ChatReasoningProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className={cn("flex w-full max-w-(--chat-measure) flex-col gap-1.5", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-fit items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronRight aria-hidden="true" className={cn("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-90")} />
        <Brain aria-hidden="true" className="size-3.5" />
        Proceso de Razonamiento Arquitectónico
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="max-h-72 overflow-y-auto border-l-2 border-border py-1 pr-2 pl-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground"
      >
        {text}
      </div>
    </div>
  )
}
