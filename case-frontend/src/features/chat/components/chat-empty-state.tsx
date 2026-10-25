import { Loader2, MessagesSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface ChatEmptyStateProps {
  enviando: boolean
  onSaludar: () => void
  onConsultarIa?: () => void
}

/** Estado vacío accionable que permite saludar o consultar directamente a Senior Dev. */
export function ChatEmptyState({ enviando, onSaludar, onConsultarIa }: ChatEmptyStateProps) {
  return (
    <Empty className="p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessagesSquare />
        </EmptyMedia>
        <EmptyTitle className="text-sm">Todavía no hay mensajes en la sala</EmptyTitle>
        <EmptyDescription className="text-xs">
          Lo que escribas aquí lo ve todo el equipo del proyecto.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" disabled={enviando} onClick={onSaludar}>
          {enviando && <Loader2 className="animate-spin" />}
          Saludar al equipo
        </Button>
        {onConsultarIa && (
          <Button variant="outline" size="sm" disabled={enviando} onClick={onConsultarIa}>
            <Sparkles className="size-3 text-primary" />
            Preguntar a @SeniorDev
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
