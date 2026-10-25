import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { abrirGuia } from "../lib/guiaEventos"
import type { GuiaSeccion } from "../types/guia.types"

const NOMBRE: Record<GuiaSeccion, string> = {
  diagrama: "el Diagrama",
  tareas: "las Tareas",
  notas: "las Notas",
  xmi: "el XMI",
  generador: "el Generador",
  general: "la herramienta",
}

/** "¿Cómo se usa esto?" de los empty states: un link, nunca compite con el primario. */
export function GuiaLink({ seccion }: { seccion: GuiaSeccion }) {
  return (
    <Button variant="link" size="xs" aria-label={`Abrir la Guía sobre ${NOMBRE[seccion]}`} onClick={() => abrirGuia(seccion)}>
      <CircleHelp data-icon="inline-start" />
      ¿Cómo se usa esto?
    </Button>
  )
}
