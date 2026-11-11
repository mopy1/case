import { cn } from "@/lib/utils"
import type { SaludMotor } from "../types/iaMotor.types"

const COLOR: Record<SaludMotor, string> = {
  activo: "bg-success",
  probando: "bg-warning animate-pulse motion-reduce:animate-none",
  caido: "bg-destructive",
  "sin-configurar": "bg-muted-foreground/50",
}

/** Punto de estado del motor (decorativo: el texto equivalente va en el `aria-label` del selector). */
export function IaMotorStatusDot({ salud, className }: { salud: SaludMotor; className?: string }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", COLOR[salud], className)} />
}
