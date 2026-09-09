import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function ProjectGeneratorPage() {
  return (
    <div className="p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Sparkles className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Generador de backend — próximamente</EmptyTitle>
          <EmptyDescription>
            Con el diagrama ya modelado, vas a poder pedirle al asistente que genere el backend completo en{" "}
            <strong>Spring Boot</strong> (Entity, Repository, DTO, Service, Controller, pom.xml) listo para
            compilar. Por ahora el generador solo produce Spring Boot — no hay selector de otro framework.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button disabled>Generar backend Spring Boot</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
