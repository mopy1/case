import { useNavigate } from "react-router-dom"
import { Download, FileCode, Workflow } from "lucide-react"
import { ChatError, CodeBlock } from "@/components/chat"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { encodeProjectId } from "@/lib/projectCode"
import { useDdlEsquema } from "../hooks/useDdlEsquema"

interface DdlViewerProps {
  proyectoId: number
  /** Se llama antes de navegar al diagrama (p. ej. para cerrar el diálogo que lo contiene). */
  onNavigate?: () => void
}

/** DDL PostgreSQL del backend con Copiar (del bloque compartido) y Descargar `.sql`; 4 estados. */
export function DdlViewer({ proyectoId, onNavigate }: DdlViewerProps) {
  const { ddl, loading, error, vacio, recargar, descargar } = useDdlEsquema(proyectoId)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Generando DDL">
        <Skeleton className="h-8 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }
  if (error) return <ChatError title="No se pudo generar el DDL" message={error} onRetry={() => void recargar()} />
  if (vacio || !ddl) {
    return (
      <Empty className="border border-dashed p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCode />
          </EmptyMedia>
          <EmptyTitle>El diagrama no tiene tablas</EmptyTitle>
          <EmptyDescription>El DDL se genera desde el diagrama. Creá al menos una tabla para verlo.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onNavigate?.()
              navigate(`/proyectos/${encodeProjectId(proyectoId)}/diagrama`)
            }}
          >
            <Workflow data-icon="inline-start" /> Ir al diagrama
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  return (
    <CodeBlock
      codigo={ddl}
      lenguaje="sql"
      actions={
        <Button type="button" variant="ghost" size="xs" onClick={descargar} aria-label="Descargar el DDL como archivo .sql">
          <Download data-icon="inline-start" /> Descargar .sql
        </Button>
      }
    />
  )
}
