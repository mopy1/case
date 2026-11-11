import { mensajeDeError } from "@/lib/api"
import { guardarMotor, probarMotor } from "../api/iaMotorApi"
import type { IaMotorSnapshot, MotorIaConfig, ProbarMotorResponse } from "../types/iaMotor.types"
import { guardarMotorLocal, leerMotor } from "./iaMotorStorage"

const INTERVALO_SALUD_MS = 60_000

function saludInicial(config: MotorIaConfig): IaMotorSnapshot["salud"] {
  if (config.motor === "DEEPSEEK") return "activo"
  return config.urlKaggle ? "probando" : "sin-configurar"
}

const inicial = leerMotor()
let snapshot: IaMotorSnapshot = { config: inicial, salud: saludInicial(inicial), ultimaPrueba: null }
const oyentes = new Set<() => void>()
let pruebaEnCurso: Promise<void> | null = null

const fallo = (error: string): ProbarMotorResponse => ({ ok: false, modelos: [], latenciaMs: null, error })

function emitir(cambio: Partial<IaMotorSnapshot>) {
  snapshot = { ...snapshot, ...cambio }
  oyentes.forEach((o) => o())
}

/** Store externo para `useSyncExternalStore`: todas las cabeceras ven el mismo motor sin Context. */
export function suscribirIaMotor(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export const obtenerIaMotor = (): IaMotorSnapshot => snapshot

/** Re-envía la preferencia al backend (la guarda en memoria: se pierde si reinicia). */
export async function sincronizarMotor(): Promise<void> {
  try {
    await guardarMotor(snapshot.config)
  } catch (err) {
    // Sin backend no hay IA de todos modos; si rechazó la URL, el punto lo muestra caído.
    if (snapshot.config.motor === "QWEN_KAGGLE") emitir({ salud: "caido", ultimaPrueba: fallo(mensajeDeError(err)) })
  }
}

/** Prueba el endpoint guardado (solo con Qwen). Las llamadas simultáneas comparten la misma prueba. */
export function probarSalud(): Promise<void> {
  const { motor, urlKaggle } = snapshot.config
  if (motor !== "QWEN_KAGGLE" || !urlKaggle) return Promise.resolve()
  if (pruebaEnCurso) return pruebaEnCurso
  emitir({ salud: "probando" })
  pruebaEnCurso = probarMotor({ url: urlKaggle })
    .catch((err: unknown) => fallo(mensajeDeError(err)))
    .then((r) => {
      // Si mientras tanto cambió la URL o el motor, esta prueba ya no aplica.
      if (snapshot.config.urlKaggle === urlKaggle && snapshot.config.motor === "QWEN_KAGGLE") {
        emitir({ salud: r.ok ? "activo" : "caido", ultimaPrueba: r })
      }
    })
    .finally(() => {
      pruebaEnCurso = null
    })
  return pruebaEnCurso
}

/** Aplica el motor solo en el front (localStorage + estado). `prueba` = resultado ya conocido para no repetirla. */
export function aplicarMotor(config: MotorIaConfig, prueba?: ProbarMotorResponse | null): void {
  guardarMotorLocal(config)
  const salud = config.motor === "DEEPSEEK" ? "activo" : prueba ? (prueba.ok ? "activo" : "caido") : "probando"
  emitir({ config, salud, ultimaPrueba: prueba ?? null })
}

/** Cambio desde el menú: aplica, sincroniza con PUT y (con Qwen) prueba la salud. */
export async function usarMotor(config: MotorIaConfig): Promise<void> {
  aplicarMotor(config)
  await sincronizarMotor()
  await probarSalud()
}

let vigias = 0
let intervalo: ReturnType<typeof setInterval> | undefined
let ultimoRegreso = 0

/** `focus` y `visibilitychange` suelen llegar juntos: se atiende uno solo cada 2 s. */
function alVolver() {
  if (document.visibilityState !== "visible" || Date.now() - ultimoRegreso < 2_000) return
  ultimoRegreso = Date.now()
  void sincronizarMotor().then(probarSalud)
}

/** Lo llama cada selector montado: al primero se sincroniza y arranca el chequeo cada 60 s + al recuperar foco. */
export function registrarVigia(): () => void {
  vigias += 1
  if (vigias === 1) {
    void sincronizarMotor().then(probarSalud)
    intervalo = setInterval(() => void probarSalud(), INTERVALO_SALUD_MS)
    window.addEventListener("focus", alVolver)
    document.addEventListener("visibilitychange", alVolver)
  }
  return () => {
    vigias -= 1
    if (vigias > 0) return
    clearInterval(intervalo)
    window.removeEventListener("focus", alVolver)
    document.removeEventListener("visibilitychange", alVolver)
  }
}
