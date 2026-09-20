import { useParams } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { decodeProjectId } from "@/lib/projectCode"
import { useNotes } from "../hooks/useNotes"
import { NoteItem } from "../components/note-item/note-item"
import { CreateNoteDialog } from "../components/create-note-dialog/create-note-dialog"

export function ProjectNotesPage() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = decodeProjectId(id)
  const { notas, loading, error, refetch } = useNotes(proyectoId)

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notas</h1>
          <p className="text-muted-foreground">El por qué de cada decisión de diseño.</p>
        </div>
        <CreateNoteDialog proyectoId={proyectoId} onCreated={refetch} />
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>No se pudieron cargar las notas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !error && notas.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Todavía no hay notas</EmptyTitle>
            <EmptyDescription>Registrá la primera decisión de diseño del proyecto.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        !error && (
          <div>
            {notas.map((nota, i) => (
              <NoteItem key={nota.id} nota={nota} isLast={i === notas.length - 1} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
