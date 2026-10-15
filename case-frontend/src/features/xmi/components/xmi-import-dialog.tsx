import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { XmiPreviewPanel } from "./xmi-preview-panel"
import type { ModoImportacionXmi, XmiPreviewResponse } from "../types/xmi.type"

/** Diálogo de importación de un `.xmi`, en dos pasos: elegir archivo → previsualizar (sin tocar la
 * base) → elegir modo y recién ahí confirmar. Separado del botón de exportar (que no necesita
 * ningún paso intermedio). Solo lo ve un ADMIN — `ProjectXmiPage` no renderiza el trigger si no. */
export function XmiImportDialog({
  trigger,
  previsualizando,
  importando,
  preview,
  error,
  onPrevisualizar,
  onImportar,
  onLimpiarPreview,
}: {
  trigger: React.ReactElement
  previsualizando: boolean
  importando: boolean
  preview: XmiPreviewResponse | null
  error: string | null
  onPrevisualizar: (archivo: File) => Promise<boolean>
  onImportar: (archivo: File, modo: ModoImportacionXmi) => Promise<boolean>
  onLimpiarPreview: () => void
}) {
  const [open, setOpen] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [modo, setModo] = useState<ModoImportacionXmi>("FUSIONAR")

  function resetear() {
    setArchivo(null)
    setModo("FUSIONAR")
    onLimpiarPreview()
  }

  async function handleConfirmar() {
    if (!archivo) return
    if (!preview) {
      await onPrevisualizar(archivo)
      return
    }
    const exito = await onImportar(archivo, modo)
    if (exito) {
      setOpen(false)
      resetear()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nuevoOpen) => {
        setOpen(nuevoOpen)
        if (!nuevoOpen) resetear()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar diagrama desde XMI</DialogTitle>
          <DialogDescription>
            Elegí un archivo <code>.xmi</code> (exportado desde acá mismo, o desde Enterprise Architect) — primero
            se muestra una previsualización, nada se guarda hasta confirmar.
          </DialogDescription>
        </DialogHeader>

        {!preview && (
          <Input
            type="file"
            accept=".xmi,application/xml,text/xml"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        )}

        {preview && <XmiPreviewPanel preview={preview} modo={modo} onModoChange={setModo} />}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {preview && (
            <Button type="button" variant="outline" onClick={resetear}>
              Elegir otro archivo
            </Button>
          )}
          <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
          <Button type="button" disabled={!archivo || previsualizando || importando} onClick={handleConfirmar}>
            {previsualizando ? "Leyendo..." : importando ? "Importando..." : preview ? "Confirmar importación" : "Previsualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
