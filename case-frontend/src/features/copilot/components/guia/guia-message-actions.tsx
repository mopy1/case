import { ArrowUpRight, MousePointerClick } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { mostrarPasos, type GuiaPasoId } from "@/features/guia"
import { Button } from "@/components/ui/button"
import { SECTION_LABELS } from "../../lib/copilotSection"
import type { CopilotSection } from "../../types/copilot.types"

interface GuiaMessageActionsProps {
  irA?: CopilotSection
  pasos?: GuiaPasoId[]
}

/** "Ir a {Sección}" y "Mostrarme dónde": ambos outline (la respuesta de la Guía no tiene primario). */
export function GuiaMessageActions({ irA, pasos }: GuiaMessageActionsProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const conPasos = !!pasos && pasos.length > 0
  if (!irA && !conPasos) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {irA && (
        <Button variant="outline" size="xs" onClick={() => navigate(`/proyectos/${id}/${irA}`)}>
          <ArrowUpRight data-icon="inline-start" /> Ir a {SECTION_LABELS[irA]}
        </Button>
      )}
      {conPasos && (
        <Button variant="outline" size="xs" onClick={() => mostrarPasos(pasos)}>
          <MousePointerClick data-icon="inline-start" /> Mostrarme dónde
        </Button>
      )}
    </div>
  )
}
