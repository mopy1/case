import { apiFetch } from "@/lib/api"
import type { CopilotConsultaRequest, CopilotConsultaResponse } from "../types/copilotApi.types"

/** Visión con Gemini (~90 s) o Qwen 3.5 en Kaggle razonando puede tardar mucho: el corte de 15 s no alcanza. */
const COPILOT_TIMEOUT_MS = 180_000

export function consultarCopilot(proyectoId: number, body: CopilotConsultaRequest) {
  return apiFetch<CopilotConsultaResponse>(`/api/proyectos/${proyectoId}/copilot/consultas`, {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: COPILOT_TIMEOUT_MS,
    errorFallback: "El Copilot no pudo responder",
  })
}
