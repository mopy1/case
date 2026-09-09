import { useParams } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardHeader } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useTasks } from "../hooks/useTasks"
import { useTaskMutations } from "../hooks/useTaskMutations"
import { TaskCard } from "../components/task-card/task-card"
import { CreateTaskDialog } from "../components/create-task-dialog/create-task-dialog"
import type { EstadoTarea } from "../types/tasks.type"

const COLUMNAS: { estado: EstadoTarea; label: string }[] = [
  { estado: "PENDIENTE", label: "Pendiente" },
  { estado: "EN_PROGRESO", label: "En progreso" },
  { estado: "HECHO", label: "Hecho" },
]

export function ProjectTasksPage() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = Number(id)
  const { tareas, loading, error, refetch } = useTasks(proyectoId)
  const { changeStatus, remove } = useTaskMutations(proyectoId)

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tareas</h1>
          <p className="text-muted-foreground">Quién hace qué, y con qué prioridad.</p>
        </div>
        <CreateTaskDialog proyectoId={proyectoId} onCreated={refetch} />
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>No se pudieron cargar las tareas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNAS.map((columna) => (
            <Card key={columna.estado} size="sm">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : !error && tareas.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Todavía no hay tareas</EmptyTitle>
            <EmptyDescription>Creá la primera para repartir el trabajo del proyecto.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMNAS.map((columna) => (
              <div key={columna.estado} className="flex flex-col gap-3 rounded-2xl bg-muted/30 p-3">
                <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {columna.label}
                </h2>
                {tareas
                  .filter((t) => t.estado === columna.estado)
                  .map((tarea) => (
                    <TaskCard
                      key={tarea.id}
                      tarea={tarea}
                      onChangeEstado={async (estado) => {
                        await changeStatus(tarea.id, { estado })
                        refetch()
                      }}
                      onDelete={async () => {
                        await remove(tarea.id)
                        refetch()
                      }}
                    />
                  ))}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
