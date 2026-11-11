import { DropdownMenuRadioItem } from "@/components/ui/dropdown-menu"
import { ETIQUETA_MOTOR, type MotorIa, type SaludMotor } from "../types/iaMotor.types"
import { IaMotorStatusDot } from "./ia-motor-status-dot"

interface IaMotorOptionProps {
  motor: MotorIa
  salud: SaludMotor
  detalle: string
}

/** Renglón del menú: punto de estado, nombre largo y una línea de detalle (estado o host del túnel). */
export function IaMotorOption({ motor, salud, detalle }: IaMotorOptionProps) {
  return (
    <DropdownMenuRadioItem closeOnClick value={motor} className="items-start">
      <IaMotorStatusDot salud={salud} className="mt-1.5" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{ETIQUETA_MOTOR[motor].larga}</span>
        <span className="truncate text-xs font-normal text-muted-foreground">{detalle}</span>
      </span>
    </DropdownMenuRadioItem>
  )
}
