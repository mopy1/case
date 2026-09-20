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

/** Diálogo de importación de un `.xmi` — separado del botón de exportar (que no necesita ningún
 * paso intermedio) porque acá sí hace falta elegir el archivo antes de mandarlo. */
export function XmiImportDialog({
  trigger,
  importando,
  error,
  onImportar,
}: {
  trigger: React.ReactElement
  importando: boolean
  error: string | null
  onImportar: (archivo: File) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)

  async function handleConfirmar() {
    if (!archivo) return
    const exito = await onImportar(archivo)
    if (exito) {
      setOpen(false)
      setArchivo(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nuevoOpen) => {
        setOpen(nuevoOpen)
        if (!nuevoOpen) setArchivo(null)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar diagrama desde XMI</DialogTitle>
          <DialogDescription>
            Elegí un archivo <code>.xmi</code> (exportado desde acá mismo, o desde Enterprise Architect) — las
            tablas, atributos y relaciones se agregan a este proyecto tal cual estén en el archivo.
          </DialogDescription>
        </DialogHeader>
        <Input type="file" accept=".xmi,application/xml,text/xml" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
          <Button type="button" disabled={!archivo || importando} onClick={handleConfirmar}>
            {importando ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
