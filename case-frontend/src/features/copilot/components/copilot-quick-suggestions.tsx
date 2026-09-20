import { Sparkles } from "lucide-react"

interface CopilotQuickSuggestionsProps {
  questions: string[]
  onSelect: (question: string) => void
  disabled?: boolean
}

export function CopilotQuickSuggestions({
  questions,
  onSelect,
  disabled = false,
}: CopilotQuickSuggestionsProps) {
  if (!questions.length) return null

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2">
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Sparkles className="size-3 text-primary" />
        <span>Sugerencias rápidas</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q)}
            className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-left text-xs text-foreground/90 transition-colors hover:border-primary/50 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
