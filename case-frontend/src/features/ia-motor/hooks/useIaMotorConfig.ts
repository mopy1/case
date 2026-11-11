import { useState } from "react"
import { mensajeDeError } from "@/lib/api"
import { guardarMotor, probarMotor } from "../api/iaMotorApi"
import { normalizarUrlKaggle, urlKaggleValida } from "../lib/iaMotorStorage"
import { aplicarMotor, probarSalud } from "../lib/iaMotorStore"
import type { ProbarMotorResponse } from "../types/iaMotor.types"

const URL_INVALIDA = "Pegá la URL https del túnel ngrok (por ejemplo https://xxxx.ngrok-free.dev/v1)."

/** Estado del formulario "Configurar endpoint": probar sin guardar y "Guardar y usar" (PUT + selecciona Qwen). */
export function useIaMotorConfig(urlInicial: string, onGuardado: () => void) {
  const [url, setUrlCruda] = useState(urlInicial)
  const [prueba, setPrueba] = useState<ProbarMotorResponse | null>(null)
  const [probando, setProbando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setUrl(valor: string) {
    setUrlCruda(valor)
    setPrueba(null)
    setError(null)
  }

  function urlLista(): string | null {
    if (urlKaggleValida(url)) return normalizarUrlKaggle(url)
    setError(URL_INVALIDA)
    return null
  }

  async function probar() {
    const destino = urlLista()
    if (!destino) return
    setProbando(true)
    try {
      setPrueba(await probarMotor({ url: destino }))
    } catch (err) {
      setPrueba({ ok: false, modelos: [], latenciaMs: null, error: mensajeDeError(err) })
    } finally {
      setProbando(false)
    }
  }

  async function guardar() {
    const destino = urlLista()
    if (!destino) return
    setGuardando(true)
    try {
      const config = await guardarMotor({ motor: "QWEN_KAGGLE", urlKaggle: destino })
      aplicarMotor(config, config.urlKaggle === destino ? prueba : null)
      if (!prueba || config.urlKaggle !== destino) void probarSalud()
      onGuardado()
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo guardar el endpoint"))
    } finally {
      setGuardando(false)
    }
  }

  return { url, setUrl, prueba, probando, guardando, error, probar, guardar }
}
