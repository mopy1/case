import { apiFetch } from "@/lib/api"
import type { MotorIaConfig, ProbarMotorRequest, ProbarMotorResponse } from "../types/iaMotor.types"

/** El backend hace `GET {url}/models` contra el túnel: un Kaggle frío puede tardar, pero no más de esto. */
const PROBAR_TIMEOUT_MS = 20_000

/** Guarda la preferencia (en memoria del backend, por usuario). 400 si la URL no es https de un host ngrok. */
export function guardarMotor(body: MotorIaConfig) {
  return apiFetch<MotorIaConfig>("/api/ia/motor", {
    method: "PUT",
    body: JSON.stringify(body),
    errorFallback: "No se pudo guardar el motor de IA",
  })
}

export function probarMotor(body: ProbarMotorRequest) {
  return apiFetch<ProbarMotorResponse>("/api/ia/motor/probar", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: PROBAR_TIMEOUT_MS,
    errorFallback: "No se pudo probar el endpoint",
  })
}
