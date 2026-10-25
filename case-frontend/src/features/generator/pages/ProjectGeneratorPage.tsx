import { useState } from "react"
import { useParams } from "react-router-dom"
import { Download, FileCode, RefreshCw, Sparkles, Terminal } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { decodeProjectId } from "@/lib/projectCode"
import { useProjectGenerator } from "../hooks/useProjectGenerator"
import { GeneratorFileTree } from "../components/generator-file-tree"
import { GeneratorCodeViewer } from "../components/generator-code-viewer"
import { DdlViewerDialog } from "../components/ddl-viewer-dialog"

export function ProjectGeneratorPage() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = decodeProjectId(id)
  const { preview, selectedFile, setSelectedFile, loading, downloading, error, recargar, descargar } =
    useProjectGenerator(proyectoId)
  const [ddlAbierto, setDdlAbierto] = useState(false)

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 p-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-full md:col-span-1" />
          <Skeleton className="h-full md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Generador de Backend Spring Boot</h1>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="size-3 text-primary" />
              Fase 4 Activa
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{preview?.nombreProyecto}</span>
            <span>•</span>
            <span>{preview?.totalArchivos ?? 0} archivos generados</span>
            <span>•</span>
            <span>{preview?.entidades.length ?? 0} tablas mapeadas</span>
            <span>•</span>
            <Badge variant="outline" className="text-[10px]">Java 21</Badge>
            <Badge variant="outline" className="text-[10px]">Spring Boot 3.4</Badge>
            <Badge variant="outline" className="text-[10px]">PostgreSQL</Badge>
            <Badge variant="outline" className="text-[10px]">OpenAPI / Swagger</Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDdlAbierto(true)}>
            <FileCode className="size-3.5" />
            Ver DDL PostgreSQL
          </Button>
          <Button variant="outline" size="sm" onClick={recargar} disabled={loading || downloading}>
            <RefreshCw className="size-3.5" />
            Actualizar
          </Button>
          <Button size="sm" onClick={descargar} disabled={downloading || !preview || preview.archivos.length === 0}>
            <Download className="size-3.5" />
            {downloading ? "Generando ZIP..." : "Descargar Proyecto (.ZIP)"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error en el generador</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview && preview.archivos.length > 0 ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card/60 p-3 md:col-span-1">
            <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Terminal className="size-3" />
              Archivos del Proyecto
            </div>
            <GeneratorFileTree
              archivos={preview.archivos}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
            />
          </div>
          <div className="min-h-0 md:col-span-3">
            <GeneratorCodeViewer file={selectedFile} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No hay entidades en el diagrama todavía. Diseña tablas en el editor UML para generar tu backend.
        </div>
      )}
      <DdlViewerDialog open={ddlAbierto} onOpenChange={setDdlAbierto} proyectoId={proyectoId} />
    </div>
  )
}
