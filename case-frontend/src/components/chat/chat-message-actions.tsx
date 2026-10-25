import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Check, Copy, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface ChatMessageActionsProps {
  /** Texto que copia "Copiar". */
  text: string
  /** F4: "Guardar como ADR" (solo se muestra si se pasa; el padre decide por rol). */
  onSaveAdr?: () => void
}

function Accion({ icon: Icon, label, onClick, className }: { icon: LucideIcon; label: string; onClick: () => void; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={label} onClick={onClick} className={className} />}>
        <Icon />
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

/** Acciones de una respuesta IA (visibles al pasar el mouse o con foco). */
export function ChatMessageActions({ text, onSaveAdr }: ChatMessageActionsProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(text)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Portapapeles bloqueado por el navegador.
    }
  }

  return (
    <>
      <Accion
        icon={copiado ? Check : Copy}
        label={copiado ? "Copiado" : "Copiar respuesta"}
        onClick={() => void copiar()}
        className={copiado ? "text-success" : "text-muted-foreground"}
      />
      {onSaveAdr && <Accion icon={FileText} label="Guardar como ADR" onClick={onSaveAdr} className="text-muted-foreground" />}
    </>
  )
}
