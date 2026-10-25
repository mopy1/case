import { CheckSquare } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import { Badge } from "@/components/ui/badge"
import type { TaskSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotTaskCardProps extends CopilotCardBaseProps {
  taskIndex: number
  task: TaskSuggestion
  isCreating: boolean
  onCreate: (messageId: string, taskIndex: number, task: TaskSuggestion) => void
}

const PRIORIDAD = { ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" }

export function CopilotTaskCard({ messageId, taskIndex, task, isCreating, onCreate, emphasis }: CopilotTaskCardProps) {
  return (
    <ChatActionCard
      icon={CheckSquare}
      title={task.titulo}
      meta={<Badge variant="secondary">{PRIORIDAD[task.prioridad ?? "MEDIA"]}</Badge>}
      status={estadoTarjeta(task.creada, isCreating)}
      emphasis={emphasis}
      actionLabel="Crear tarea"
      runningLabel="Creando tarea…"
      doneLabel="Tarea creada en el Kanban"
      onAction={() => onCreate(messageId, taskIndex, task)}
    >
      {/\w/.test(task.descripcion ?? "") && <p className="text-muted-foreground">{task.descripcion}</p>}
    </ChatActionCard>
  )
}
