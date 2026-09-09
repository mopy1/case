import { FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function ProjectXmiPage() {
  return (
    <div className="p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <FileUp className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Exportación a XMI — próximamente</EmptyTitle>
          <EmptyDescription>
            Vas a poder exportar este diagrama a formato .xmi (UML 2.5) para abrirlo en Enterprise Architect, e
            importar diagramas hechos ahí de vuelta al lienzo.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button disabled>Exportar XMI</Button>
            <Button variant="outline" disabled>
              Importar XMI
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
