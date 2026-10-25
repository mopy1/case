import type { ActionStatus } from "@/components/chat"

/** Props comunes de las tarjetas del Copilot. */
export interface CopilotCardBaseProps {
  messageId: string
  /** primary solo si es la única sugerencia pendiente del mensaje. */
  emphasis?: "primary" | "secondary"
}

/** hecho → done · en curso → running · resto → idle. */
export function estadoTarjeta(hecho: boolean | undefined, enCurso: boolean): ActionStatus {
  if (hecho) return "done"
  return enCurso ? "running" : "idle"
}
