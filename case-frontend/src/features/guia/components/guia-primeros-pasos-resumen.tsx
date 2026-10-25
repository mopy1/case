import { ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TOTAL_MISIONES } from "../lib/guiaMisiones.data"
import { useGuiaProgreso } from "../hooks/useGuiaProgreso"

/** Fila colapsada de "Primeros pasos" ("Ver más tarde" o hilo con mensajes). */
export function GuiaPrimerosPasosResumen({ onMostrar }: { onMostrar: () => void }) {
  const { progreso } = useGuiaProgreso()

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
      <ListChecks className="size-4 text-muted-foreground" aria-hidden />
      <span className="flex-1 text-sm">
        Primeros pasos · <span className="tabular-nums">{progreso.logradas.length}/{TOTAL_MISIONES}</span>
      </span>
      <Button variant="ghost" size="xs" onClick={onMostrar}>
        Mostrar
      </Button>
    </div>
  )
}
