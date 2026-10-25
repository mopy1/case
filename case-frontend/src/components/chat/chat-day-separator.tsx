import { Marker, MarkerContent } from "@/components/ui/marker"
import { etiquetaDia } from "./lib/chat-time"

/** Separador "Hoy" / "Ayer" / "24 oct" cuando cambia la fecha entre dos mensajes. */
export function ChatDaySeparator({ iso }: { iso: string }) {
  return (
    <Marker variant="separator" className="mt-5 text-xs">
      <MarkerContent>{etiquetaDia(iso)}</MarkerContent>
    </Marker>
  )
}
