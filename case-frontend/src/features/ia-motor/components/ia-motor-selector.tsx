import { useState } from "react"
import { Cpu, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIaMotor } from "../hooks/useIaMotor"
import { usarMotor } from "../lib/iaMotorStore"
import { etiquetaSelector, hostDe, textoSalud } from "../lib/iaMotorTexto"
import { ETIQUETA_MOTOR, type MotorIa } from "../types/iaMotor.types"
import { IaMotorConfigDialog } from "./ia-motor-config-dialog"
import { IaMotorOption } from "./ia-motor-option"
import { IaMotorStatusDot } from "./ia-motor-status-dot"

/** Selector compacto del motor de IA (cabeceras del Copilot y del Equipo). En angosto queda punto + ícono. */
export function IaMotorSelector() {
  const snapshot = useIaMotor({ vigilar: true })
  const { config, salud } = snapshot
  const [configurando, setConfigurando] = useState(false)
  const qwen = config.motor === "QWEN_KAGGLE"

  function elegir(valor: string) {
    const motor = valor as MotorIa
    if (motor === config.motor) return
    if (motor === "QWEN_KAGGLE" && !config.urlKaggle) return setConfigurando(true)
    void usarMotor({ motor, urlKaggle: config.urlKaggle })
  }

  const detalleQwen = qwen ? textoSalud(snapshot) : (hostDe(config.urlKaggle) ?? "Sin endpoint configurado")

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" aria-label={etiquetaSelector(snapshot)} className="gap-1.5 @max-[28rem]/chat:px-2" />}
        >
          <IaMotorStatusDot salud={salud} />
          <Cpu data-icon="inline-start" />
          <span className="@max-[28rem]/chat:sr-only">{ETIQUETA_MOTOR[config.motor].corta}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuRadioGroup value={config.motor} onValueChange={elegir}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Motor de IA · lo usan el Copilot y Senior Dev</DropdownMenuLabel>
              <IaMotorOption motor="DEEPSEEK" salud="activo" detalle={qwen ? "Respaldo automático" : "Disponible · por defecto"} />
              <IaMotorOption motor="QWEN_KAGGLE" salud={qwen ? salud : "sin-configurar"} detalle={detalleQwen} />
            </DropdownMenuGroup>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfigurando(true)}>
            <Settings2 />
            Configurar endpoint…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <IaMotorConfigDialog open={configurando} onOpenChange={setConfigurando} urlInicial={config.urlKaggle} />
    </>
  )
}
