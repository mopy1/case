import { useEffect, useState, type ReactNode } from "react"
import { ChatShell } from "@/components/chat"
import { escuchar, EVENTO, GuiaPrimerosPasosBloque, useGuiaProgreso, type GuiaPanelDetail } from "@/features/guia"
import { useGuiaChat } from "../../hooks/useGuiaChat"
import type { CopilotSection } from "../../types/copilot.types"
import { CopilotComposer } from "../copilot-composer"
import { GuiaEmpty } from "./guia-empty"
import { GuiaHeader } from "./guia-header"
import { GuiaMessageList } from "./guia-message-list"

interface GuiaViewProps {
  proyectoId: number
  /** Solo la vista activa atiende el push-to-talk. */
  activo: boolean
  modeSwitch: ReactNode
}

/** Modo Guía del Copilot: "Primeros pasos" + conversación que enseña a usar la herramienta (nunca la modifica). */
export function GuiaView({ proyectoId, activo, modeSwitch }: GuiaViewProps) {
  const { mensajes, loading, seccion, enviar, reiniciar } = useGuiaChat(proyectoId)
  const { progreso } = useGuiaProgreso()
  const [pedida, setPedida] = useState<{ seccion: CopilotSection; desde: CopilotSection } | null>(null)
  const seccionSugerencias = pedida?.desde === seccion ? pedida.seccion : seccion
  const vacio = mensajes.length === 0 && !loading
  const tarjetaArriba = progreso.estado === "pendiente" && !progreso.colapsada

  // "¿Cómo se usa esto?" trae su sección: sus sugerencias valen hasta que el usuario cambie de pantalla.
  useEffect(
    () => escuchar<GuiaPanelDetail>(EVENTO.panel, (d) => d?.seccion && setPedida({ seccion: d.seccion, desde: seccion })),
    [seccion]
  )

  useEffect(() => {
    if (!activo) return
    return escuchar<{ text: string }>("copilot:voice-submit", (d) => d?.text && void enviar(d.text))
  }, [activo, enviar])

  return (
    <ChatShell
      header={<GuiaHeader section={seccion} modeSwitch={modeSwitch} onClear={reiniciar} canClear={mensajes.length > 0} />}
      composer={
        <CopilotComposer
          section={seccion}
          loading={loading}
          onSend={(texto) => void enviar(texto)}
          sinImagen
          placeholder="Preguntá cómo se hace algo…"
          ariaLabel="Mensaje para la Guía"
        />
      }
    >
      {vacio ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <GuiaPrimerosPasosBloque hiloVacio />
          <GuiaEmpty section={seccionSugerencias} onAsk={(q) => void enviar(q)} compacto={tarjetaArriba} />
        </div>
      ) : (
        <>
          <GuiaPrimerosPasosBloque hiloVacio={false} />
          <GuiaMessageList mensajes={mensajes} loading={loading} />
        </>
      )}
    </ChatShell>
  )
}
