/** Espejo de `GET/PUT /api/ia/motor` y `POST /api/ia/motor/probar` (modules/ia del backend). */
export type MotorIa = "DEEPSEEK" | "QWEN_KAGGLE"

export interface MotorIaConfig {
  motor: MotorIa
  /** Base OpenAI-compatible del túnel ngrok (termina en `/v1`); null con DeepSeek o sin configurar. */
  urlKaggle: string | null
}

export interface ProbarMotorRequest {
  url: string
}

export interface ProbarMotorResponse {
  ok: boolean
  modelos: string[]
  latenciaMs: number | null
  error: string | null
}

/** Salud del endpoint de Kaggle según la última prueba (DeepSeek no se prueba: siempre "activo"). */
export type SaludMotor = "sin-configurar" | "probando" | "activo" | "caido"

export interface IaMotorSnapshot {
  config: MotorIaConfig
  salud: SaludMotor
  /** Última prueba de salud del endpoint guardado (null = nunca se probó en esta sesión). */
  ultimaPrueba: ProbarMotorResponse | null
}

export const ETIQUETA_MOTOR: Record<MotorIa, { larga: string; corta: string }> = {
  DEEPSEEK: { larga: "DeepSeek Cloud", corta: "DeepSeek" },
  QWEN_KAGGLE: { larga: "Qwen 3.5 MoE (Kaggle GPU)", corta: "Qwen 3.5" },
}

export const CONFIG_POR_DEFECTO: MotorIaConfig = { motor: "DEEPSEEK", urlKaggle: null }
