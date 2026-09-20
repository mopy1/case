import { useParams } from "react-router-dom"
import { FileDown, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { decodeProjectId } from "@/lib/projectCode"
import { useXmiExchange } from "../hooks/useXmiExchange"
import { XmiImportDialog } from "../components/xmi-import-dialog"

/** Página delgada — toda la lógica de exportar/importar vive en `useXmiExchange`. Fase 3 del plan
 * (interoperabilidad con Enterprise Architect, ver `case-backend/AGENTS.md` para el detalle del
 * formato `.xmi` que genera/lee el backend). */
export function ProjectXmiPage() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = decodeProjectId(id)
  const { handleExportar, handleImportar, exportando, importando, errorExportar, errorImportar } = useXmiExchange(proyectoId)

  return (
    <div className="p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <FileUp className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Interoperabilidad con Enterprise Architect</EmptyTitle>
          <EmptyDescription>
            Exportá este diagrama a formato <code>.xmi</code> (UML) para abrirlo en Enterprise Architect, o importá
            un <code>.xmi</code> hecho ahí (o exportado desde acá antes) para traer sus tablas y relaciones al
            lienzo.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button onClick={handleExportar} disabled={exportando}>
              <FileDown />
              {exportando ? "Exportando..." : "Exportar XMI"}
            </Button>
            <XmiImportDialog
              trigger={
                <Button variant="outline">
                  <FileUp />
                  Importar XMI
                </Button>
              }
              importando={importando}
              error={errorImportar}
              onImportar={handleImportar}
            />
          </div>
          {errorExportar && (
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertDescription>{errorExportar}</AlertDescription>
            </Alert>
          )}
        </EmptyContent>
      </Empty>
    </div>
  )
}
