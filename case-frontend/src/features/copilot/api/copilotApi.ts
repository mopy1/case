import { apiFetch } from "@/lib/api"
import type { CopilotConsultaRequest, CopilotConsultaResponse } from "../types/copilotApi.types"

/** Visión con varios modelos de Gemini puede tardar ~90 s: el corte de 15 s por defecto no alcanza. */
const COPILOT_TIMEOUT_MS = 100_000

export function consultarCopilot(proyectoId: number, body: CopilotConsultaRequest) {
  return apiFetch<CopilotConsultaResponse>(`/api/proyectos/${proyectoId}/copilot/consultas`, {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: COPILOT_TIMEOUT_MS,
    errorFallback: "El Copilot no pudo responder",
  })
}
