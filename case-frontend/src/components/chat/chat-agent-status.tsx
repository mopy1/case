import { Check, Circle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/ui/message"
import { Spinner } from "@/components/ui/spinner"
import { ChatAvatar } from "./chat-avatar"
import type { AgentStep } from "./chat.types"

export interface ChatAgentStatusProps {
  agentName: string
  label: string
  /** Pasos de herramientas (F3): pendiente, activo, hecho, error. */
  steps?: AgentStep[]
  onCancel?: () => void
}

const ICONO_PASO = {
  pending: <Circle className="size-3.5 text-muted-foreground/50" />,
  active: <Spinner className="size-3.5 text-muted-foreground" />,
  done: <Check className="size-3.5 text-success" />,
  error: <X className="size-3.5 text-destructive" />,
}

/** Fila de "la IA está trabajando": etiqueta con shimmer y pasos opcionales. */
export function ChatAgentStatus({ agentName, label, steps, onCancel }: ChatAgentStatusProps) {
  return (
    <Message align="start" className="mt-5" role="status" aria-live="polite">
      <MessageAvatar className="min-w-7 self-start bg-transparent">
        <ChatAvatar author={{ id: "agent", name: agentName, kind: "agent" }} />
      </MessageAvatar>
      <MessageContent className="gap-1">
        <MessageHeader className="gap-1.5 px-0 font-normal">
          <span className="font-medium text-foreground">{agentName}</span>
          {onCancel && (
            <Button variant="ghost" size="xs" className="ml-auto" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </MessageHeader>
        <p className="shimmer text-sm text-muted-foreground motion-reduce:shimmer-none">{label}</p>
        {steps && steps.length > 0 && (
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {steps.map((paso) => (
              <li key={paso.id} className="flex items-center gap-1.5">
                {ICONO_PASO[paso.state]}
                <span className={paso.state === "active" ? "text-foreground" : undefined}>{paso.label}</span>
              </li>
            ))}
          </ul>
        )}
      </MessageContent>
    </Message>
  )
}
