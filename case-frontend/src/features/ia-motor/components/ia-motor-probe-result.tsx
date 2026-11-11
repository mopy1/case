import { CircleAlert, CircleCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ProbarMotorResponse } from "../types/iaMotor.types"

const MAX_MODELOS = 4

/** Resultado de "Probar conexión" (región `aria-live`: el lector de pantalla lo anuncia al llegar). */
export function IaMotorProbeResult({ prueba, probando }: { prueba: ProbarMotorResponse | null; probando: boolean }) {
  return (
    <div role="status" aria-live="polite" className="min-h-5 text-xs">
      {probando && <p className="text-muted-foreground">Probando el endpoint de Kaggle…</p>}
      {!probando && prueba?.ok && (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-1.5 font-medium text-success">
            <CircleCheck className="size-4" aria-hidden="true" />
            Conectado{prueba.latenciaMs != null && ` · ${prueba.latenciaMs} ms`}
          </p>
          {prueba.modelos.length > 0 && (
            <div className="flex flex-wrap gap-1" aria-label="Modelos disponibles">
              {prueba.modelos.slice(0, MAX_MODELOS).map((m) => (
                <Badge key={m} variant="outline" className="max-w-full font-mono">
                  <span className="truncate">{m}</span>
                </Badge>
              ))}
              {prueba.modelos.length > MAX_MODELOS && <Badge variant="secondary">+{prueba.modelos.length - MAX_MODELOS}</Badge>}
            </div>
          )}
        </div>
      )}
      {!probando && prueba && !prueba.ok && (
        <p className="flex items-start gap-1.5 text-destructive">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          {prueba.error ?? "El endpoint no respondió"}
        </p>
      )}
    </div>
  )
}
