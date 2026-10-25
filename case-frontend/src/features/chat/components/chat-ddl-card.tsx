import { useState } from "react"
import { FileCode } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import { DdlViewer } from "@/features/generator"

/** Respuesta con `GENERAR_DDL` y sin cambios: tarjeta secundaria cuyo único botón abre el DDL del backend. */
export function ChatDdlCard({ proyectoId }: { proyectoId: number }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <ChatActionCard
      icon={FileCode}
      title="DDL del modelo"
      status="idle"
      emphasis="secondary"
      actionLabel={abierto ? "Ocultar DDL" : "Ver DDL del modelo"}
      onAction={() => setAbierto((v) => !v)}
    >
      {abierto ? (
        <DdlViewer proyectoId={proyectoId} />
      ) : (
        <p className="text-muted-foreground">Senior Dev no escribe SQL: el DDL se genera desde el diagrama actual.</p>
      )}
    </ChatActionCard>
  )
}
