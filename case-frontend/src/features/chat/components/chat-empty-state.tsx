import { Loader2, MessagesSquare } from "lucide-react"
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
}

export function ChatEmptyState({ enviando, onSaludar }: ChatEmptyStateProps) {
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
      <EmptyContent>
        <Button variant="outline" size="sm" disabled={enviando} onClick={onSaludar}>
          {enviando && <Loader2 className="animate-spin" />}
          Saludar al equipo
        </Button>
      </EmptyContent>
    </Empty>
  )
}
