import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DdlViewer } from "./ddl-viewer"

interface DdlViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: number
}

/** Diálogo controlado con el visor DDL; el contenido se monta al abrir, así el SQL siempre está al día. */
export function DdlViewerDialog({ open, onOpenChange, proyectoId }: DdlViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>DDL PostgreSQL del modelo</DialogTitle>
          <DialogDescription>Generado desde el diagrama, sin IA: el mismo diagrama produce siempre el mismo SQL.</DialogDescription>
        </DialogHeader>
        {open && <DdlViewer proyectoId={proyectoId} onNavigate={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}
