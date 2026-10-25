import { Compass } from "lucide-react"
import { ChatEmpty, ChatQuickActions } from "@/components/chat"
import { GUIA_PREGUNTA_PRINCIPAL, GUIA_SUGERENCIAS } from "../../lib/guiaSugerencias.data"
import type { CopilotSection } from "../../types/copilot.types"

interface GuiaEmptyProps {
  section: CopilotSection
  onAsk: (pregunta: string) => void
  /** Con la tarjeta "Primeros pasos" arriba: solo las sugerencias (su "Llevarme ahí" ya es el primario). */
  compacto?: boolean
}

export function GuiaEmpty({ section, onAsk, compacto }: GuiaEmptyProps) {
  const sugerencias = GUIA_SUGERENCIAS[section].map((q) => ({ id: q, label: q }))

  if (compacto) {
    const todas = [{ id: GUIA_PREGUNTA_PRINCIPAL, label: GUIA_PREGUNTA_PRINCIPAL }, ...sugerencias]
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-4">
        <p className="text-xs text-muted-foreground">O preguntale a la Guía</p>
        <ChatQuickActions actions={todas} onSelect={(a) => onAsk(a.label)} ariaLabel="Preguntas sugeridas" layout="stack" />
      </div>
    )
  }

  return (
    <ChatEmpty
      icon={Compass}
      title="Tu guía de la herramienta"
      description="Preguntame cómo se hace algo y te muestro dónde está cada botón."
      primaryAction={{ label: GUIA_PREGUNTA_PRINCIPAL, onClick: () => onAsk(GUIA_PREGUNTA_PRINCIPAL) }}
    >
      <ChatQuickActions actions={sugerencias} onSelect={(a) => onAsk(a.label)} ariaLabel="Preguntas sugeridas" layout="stack" />
    </ChatEmpty>
  )
}
