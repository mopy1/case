import { ArrowUpRight, Download, FileCode } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import type { SystemActionSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotSystemActionCardProps extends CopilotCardBaseProps {
  actionIndex: number
  action: SystemActionSuggestion
  isExecuting: boolean
  onExecute: (messageId: string, actionIndex: number, action: SystemActionSuggestion) => void
}

const ICONO = { GENERAR_BACKEND: FileCode, EXPORTAR_XMI: Download, NAVEGAR: ArrowUpRight }

export function CopilotSystemActionCard({ messageId, actionIndex, action, isExecuting, onExecute, emphasis }: CopilotSystemActionCardProps) {
  return (
    <ChatActionCard
      icon={ICONO[action.tipo]}
      title={action.label}
      status={estadoTarjeta(action.ejecutada, isExecuting)}
      emphasis={emphasis}
      actionLabel={action.tipo === "NAVEGAR" ? "Ir" : "Ejecutar"}
      runningLabel="Ejecutando…"
      doneLabel="Acción ejecutada"
      onAction={() => onExecute(messageId, actionIndex, action)}
    />
  )
}
