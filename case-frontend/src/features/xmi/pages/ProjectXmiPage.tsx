import { useParams } from "react-router-dom"
import { FileDown, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { GuiaLink } from "@/features/guia"
import { decodeProjectId } from "@/lib/projectCode"
import { useProject } from "@/features/projects/hooks/useProject"
import { useXmiExchange } from "../hooks/useXmiExchange"
import { XmiImportDialog } from "../components/xmi-import-dialog"

/** Página delgada — toda la lógica de exportar/importar vive en `useXmiExchange`. Fase 3 del plan
 * (interoperabilidad con Enterprise Architect, ver `case-backend/AGENTS.md` para el detalle del
 * formato `.xmi` que genera/lee el backend). Importar exige rol ADMIN (pedido explícito del
 * profesor 2026-09-26 — un COLABORADOR importando a la vez que otro generaría choques de nombre
 * en el diagrama compartido): el backend ya lo rechaza, acá directamente no se muestra el botón a
 * quien no sea ADMIN, para no ofrecer una acción que va a fallar. */
export function ProjectXmiPage() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = decodeProjectId(id)
  const { proyecto } = useProject(proyectoId)
  const esAdmin = proyecto?.miRol === "ADMIN"
  const {
    handleExportar,
    handlePrevisualizar,
    handleImportar,
    limpiarPreview,
    exportando,
    previsualizando,
    importando,
    preview,
    errorExportar,
    errorImportar,
  } = useXmiExchange(proyectoId)

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
            lienzo. {!esAdmin && "Solo el ADMIN del proyecto puede importar."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button onClick={handleExportar} disabled={exportando} data-guia="xmi-exportar">
              <FileDown />
              {exportando ? "Exportando..." : "Exportar XMI"}
            </Button>
            {esAdmin && (
              <XmiImportDialog
                trigger={
                  <Button variant="outline">
                    <FileUp />
                    Importar XMI
                  </Button>
                }
                previsualizando={previsualizando}
                importando={importando}
                preview={preview}
                error={errorImportar}
                onPrevisualizar={handlePrevisualizar}
                onImportar={handleImportar}
                onLimpiarPreview={limpiarPreview}
              />
            )}
          </div>
          {errorExportar && (
            <Alert variant="destructive" className="mt-4 text-left">
              <AlertDescription>{errorExportar}</AlertDescription>
            </Alert>
          )}
          <GuiaLink seccion="xmi" />
        </EmptyContent>
      </Empty>
    </div>
  )
}
