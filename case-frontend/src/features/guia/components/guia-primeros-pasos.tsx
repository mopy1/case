import { CheckCheck, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useGuiaProgreso } from "../hooks/useGuiaProgreso"
import { useIrAMision } from "../hooks/useIrAMision"
import { MISIONES, TOTAL_MISIONES } from "../lib/guiaMisiones.data"
import { GuiaMisionItem } from "./guia-mision-item"

const CARD = "shrink-0 gap-3 rounded-2xl shadow-none ring-border dark:ring-border"

function Exito({ onCerrar, className }: { onCerrar: () => void; className?: string }) {
  return (
    <Card size="sm" className={cn(CARD, className)}>
      <CardContent className="flex flex-col items-start gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CheckCheck className="size-4 text-success" aria-hidden /> Completaste los primeros pasos
        </p>
        <p className="text-sm text-muted-foreground">Ya sabés usar lo esencial. La Guía sigue acá si tenés dudas.</p>
        <Button variant="outline" size="xs" onClick={onCerrar}>
          Cerrar
        </Button>
      </CardContent>
    </Card>
  )
}

/** Tarjeta "Primeros pasos n/7" del modo Guía: barra, 7 misiones (una primaria), Ver más tarde y Omitir. */
export function GuiaPrimerosPasos({ className }: { className?: string }) {
  const { progreso, detectado, omitir, verMasTarde, cerrar } = useGuiaProgreso()
  const irA = useIrAMision()
  const hechas = progreso.logradas.length
  if (hechas >= TOTAL_MISIONES) return <Exito onCerrar={cerrar} className={className} />
  const proxima = MISIONES.find((m) => !progreso.logradas.includes(m.id))

  function alOmitir() {
    omitir()
    toast("Podés retomarla desde tu menú de usuario › Primeros pasos")
  }

  return (
    <Card size="sm" className={cn(CARD, className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ListChecks className="size-4 text-muted-foreground" aria-hidden /> Primeros pasos
        </CardTitle>
        <CardDescription className="text-xs">Siete misiones cortas con un proyecto de práctica.</CardDescription>
        <CardAction>
          <Badge variant="secondary" className="tabular-nums">
            {hechas}/{TOTAL_MISIONES}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div
          role="progressbar"
          aria-label="Progreso de la inducción"
          aria-valuemin={0}
          aria-valuemax={TOTAL_MISIONES}
          aria-valuenow={hechas}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(hechas / TOTAL_MISIONES) * 100}%` }} />
        </div>
        <ol className="flex flex-col">
          {MISIONES.map((m) => (
            <GuiaMisionItem
              key={m.id}
              mision={m}
              hecha={progreso.logradas.includes(m.id)}
              proxima={m.id === proxima?.id}
              cargando={!detectado}
              onIr={irA}
            />
          ))}
        </ol>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" size="xs" onClick={verMasTarde}>
          Ver más tarde
        </Button>
        <Button variant="ghost" size="xs" onClick={alOmitir}>
          Omitir
        </Button>
      </CardFooter>
    </Card>
  )
}
