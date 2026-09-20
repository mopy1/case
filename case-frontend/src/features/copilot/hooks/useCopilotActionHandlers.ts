import type { CopilotMessage } from "../types/copilot.types"
import { useCopilotDiagramActionHandlers } from "./useCopilotDiagramActionHandlers"
import { useCopilotSystemActionHandlers } from "./useCopilotSystemActionHandlers"

export function useCopilotActionHandlers(
  proyectoId: number,
  setMessages: React.Dispatch<React.SetStateAction<CopilotMessage[]>>
) {
  const diagramHandlers = useCopilotDiagramActionHandlers(proyectoId, setMessages)
  const systemHandlers = useCopilotSystemActionHandlers(proyectoId, setMessages)

  return {
    ...diagramHandlers,
    ...systemHandlers,
  }
}
