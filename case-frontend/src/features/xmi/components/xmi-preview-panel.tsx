import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ModoImportacionXmi, XmiPreviewResponse } from "../types/xmi.type"

const MODOS = [
  { value: "FUSIONAR" as const, label: "Fusionar (agregar a lo que ya hay)" },
  { value: "REEMPLAZAR" as const, label: "Reemplazar (vaciar el diagrama actual primero)" },
]

/** Lo que se ve tras elegir el archivo — antes de tocar la base de datos. `tablasExistentes` en
 * modo FUSIONAR no son un error: se reusan tal cual (sin tocar sus atributos), solo se agregan las
 * relaciones nuevas que las conecten. En REEMPLAZAR no aplica el aviso, porque el diagrama actual
 * se vacía entero antes de importar. */
export function XmiPreviewPanel({
  preview,
  modo,
  onModoChange,
}: {
  preview: XmiPreviewResponse
  modo: ModoImportacionXmi
  onModoChange: (modo: ModoImportacionXmi) => void
}) {
  const hayExistentes = preview.tablasExistentes.length > 0

  return (
    <div className="space-y-3 text-left">
      <p className="text-sm text-muted-foreground">
        Detectado: <span className="font-medium text-foreground">{preview.dialectoDetectado}</span> ·{" "}
        {preview.tablas.length} tabla(s) · {preview.totalRelaciones} relación(es)
      </p>

      <div className="flex flex-wrap gap-1.5">
        {preview.tablas.map((tabla) => (
          <Badge key={tabla} variant={preview.tablasExistentes.includes(tabla) ? "outline" : "secondary"}>
            {tabla}
          </Badge>
        ))}
      </div>

      {hayExistentes && modo === "FUSIONAR" && (
        <Alert>
          <AlertDescription>
            Ya existen en el proyecto: {preview.tablasExistentes.join(", ")}. No se van a duplicar ni a tocar sus
            atributos — se reusan tal cual, y solo se crean las relaciones nuevas que las conecten con el resto.
          </AlertDescription>
        </Alert>
      )}

      {modo === "REEMPLAZAR" && preview.totalEntidadesActuales > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Modo Reemplazar: se van a borrar las {preview.totalEntidadesActuales} tabla(s) que el proyecto ya tiene
            (con sus atributos y relaciones), sea cual sea su nombre, antes de crear todo de nuevo desde el archivo.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Modo de importación</span>
        <Select items={MODOS} value={modo} onValueChange={(v) => onModoChange(v as ModoImportacionXmi)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {MODOS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
