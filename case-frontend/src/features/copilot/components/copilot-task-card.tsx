import { Check, CheckSquare, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { TaskSuggestion } from "../types/copilot.types"

interface CopilotTaskCardProps {
  messageId: string
  taskIndex: number
  task: TaskSuggestion
  isCreating: boolean
  onCreate: (messageId: string, taskIndex: number, task: TaskSuggestion) => void
}

export function CopilotTaskCard({
  messageId,
  taskIndex,
  task,
  isCreating,
  onCreate,
}: CopilotTaskCardProps) {
  const prioVariant =
    task.prioridad === "ALTA"
      ? "destructive"
      : task.prioridad === "MEDIA"
      ? "secondary"
      : "outline"

  return (
    <Card className="flex w-full max-w-full flex-col gap-2 rounded-xl border border-border bg-card p-2.5 sm:p-3 text-xs shadow-xs overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <CheckSquare className="size-3.5 text-primary" />
          <span>Tarea Kanban</span>
        </div>
        <Badge variant={prioVariant} className="text-[10px] font-mono">
          {task.prioridad || "MEDIA"}
        </Badge>
      </div>

      <div className="flex flex-col gap-0.5 break-words">
        <strong className="font-semibold text-foreground">{task.titulo}</strong>
        <p className="text-[11px] text-muted-foreground">{task.descripcion}</p>
      </div>

      <div className="pt-1">
        {task.creada ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            ✓ Tarea creada en Kanban
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-auto min-h-7 py-1 px-2.5 gap-1.5 text-xs whitespace-normal text-left hover:border-primary/40 hover:bg-primary/10"
            disabled={isCreating}
            onClick={() => onCreate(messageId, taskIndex, task)}
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Creando tarea...
              </>
            ) : (
              <>
                <CheckSquare className="size-3 text-primary" />
                Crear tarea en Kanban
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
