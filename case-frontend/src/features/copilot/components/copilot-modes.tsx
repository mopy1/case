import { useCopilotModo } from "../hooks/useCopilotModo"
import { CopilotAssistantView } from "./copilot-assistant-view"
import { CopilotModeSwitch } from "./copilot-mode-switch"
import { GuiaView } from "./guia/guia-view"

/**
 * Pestaña Copilot: los dos modos quedan montados (dos historiales en memoria separados);
 * cambiar de modo solo oculta el inactivo, nunca borra ni mezcla conversaciones.
 */
export function CopilotModes({ proyectoId }: { proyectoId: number }) {
  const { modo, setModo } = useCopilotModo()
  const switchModo = <CopilotModeSwitch modo={modo} onChange={setModo} />

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col" hidden={modo !== "asistente"}>
        <CopilotAssistantView proyectoId={proyectoId} activo={modo === "asistente"} modeSwitch={switchModo} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col" hidden={modo !== "guia"}>
        <GuiaView proyectoId={proyectoId} activo={modo === "guia"} modeSwitch={switchModo} />
      </div>
    </>
  )
}
