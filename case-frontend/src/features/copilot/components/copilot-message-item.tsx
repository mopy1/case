import { Check, FileText, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AdrSuggestion, CopilotMessage } from "../types/copilot.types"

interface CopilotMessageItemProps {
  message: CopilotMessage
  isSavingAdr: boolean
  onSaveAdr: (messageId: string, adr: AdrSuggestion) => void
}

function renderFormattedContent(text: string) {
  const lines = text.split("\n")
  return (
    <div className="flex flex-col gap-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-1" />

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-semibold text-foreground tracking-tight">
              {trimmed.replace("### ", "")}
            </h4>
          )
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")
        const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed

        const formatted = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-primary">
                {part.slice(1, -1)}
              </code>
            )
          }
          return part
        })

        return (
          <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
            {isBullet && <span className="text-primary font-bold">•</span>}
            <span className="flex-1">{formatted}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CopilotMessageItem({ message, isSavingAdr, onSaveAdr }: CopilotMessageItemProps) {
  const isUser = message.sender === "user"

  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`rounded-2xl px-3.5 py-2.5 text-xs ${
          isUser
            ? "max-w-[85%] rounded-tr-xs bg-primary text-primary-foreground shadow-xs"
            : "max-w-[95%] rounded-tl-xs border border-border/70 bg-card text-card-foreground shadow-xs"
        }`}
      >
        {isUser ? <p className="whitespace-pre-wrap">{message.text}</p> : renderFormattedContent(message.text)}
      </div>

      {message.adrSuggestion && !isUser && (
        <Card className="flex max-w-[95%] flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <FileText className="size-3.5 text-primary" />
            <span>Sugerencia de Decisión Arquitectónica (ADR)</span>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div>
              <strong className="text-foreground">Acción: </strong>
              {message.adrSuggestion.accion}
            </div>
            <div>
              <strong className="text-foreground">Motivo: </strong>
              {message.adrSuggestion.motivo}
            </div>
          </div>

          <div className="pt-1">
            {message.adrSuggestion.guardada ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Check className="size-3" />
                ✓ Nota guardada en el proyecto
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs hover:border-primary/40 hover:bg-primary/10"
                disabled={isSavingAdr}
                onClick={() => onSaveAdr(message.id, message.adrSuggestion!)}
              >
                {isSavingAdr ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Guardando nota...
                  </>
                ) : (
                  "📝 Guardar como Nota ADR en el proyecto"
                )}
              </Button>
            )}
          </div>
        </Card>
      )}

      <span className="px-1 text-[10px] text-muted-foreground">{message.timestamp}</span>
    </div>
  )
}
