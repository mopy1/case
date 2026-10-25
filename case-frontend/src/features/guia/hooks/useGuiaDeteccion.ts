import { useEffect } from "react"
import { useAuth, type AuthUser } from "@/hooks/useAuth"
import { cargarDatosGuia } from "../api/guiaDatos"
import { detectarMisiones, FUENTES_POR_MISION } from "../lib/guiaDeteccion"
import { escuchar, EVENTO } from "../lib/guiaEventos"
import { MISION_IDS } from "../lib/guiaMisiones.data"
import { marcarDetectado, obtenerGuia, sumarLogradas } from "../lib/guiaStore"
import type { ChatSentDetail } from "../types/guia.types"
import { useGuiaProgreso } from "./useGuiaProgreso"

const DEBOUNCE_MS = 1500

async function detectar(proyectoId: number, yo: AuthUser) {
  const { logradas } = obtenerGuia(yo.id).progreso
  const faltan = MISION_IDS.filter((id) => !logradas.includes(id))
  const fuentes = [...new Set(faltan.flatMap((id) => FUENTES_POR_MISION[id]))]
  if (fuentes.length > 0) sumarLogradas(yo.id, detectarMisiones(await cargarDatosGuia(proyectoId, fuentes), yo))
  marcarDetectado(yo.id)
}

/** Marca misiones logradas leyendo el backend. Solo corre con la guía pendiente (omitida/completada = 0 peticiones). */
export function useGuiaDeteccion(proyectoId: number) {
  const { user } = useAuth()
  const { progreso } = useGuiaProgreso()
  const activa = progreso.estado === "pendiente" && !!user && proyectoId > 0
  const yoId = user?.id
  const yoNombre = user?.username

  useEffect(() => {
    if (!activa || !yoId || !yoNombre) return
    const yo: AuthUser = { id: yoId, username: yoNombre, email: "" }
    let timer: ReturnType<typeof setTimeout> | undefined
    const correr = () => void detectar(proyectoId, yo)
    const programar = () => {
      clearTimeout(timer)
      timer = setTimeout(correr, DEBOUNCE_MS)
    }
    const alVolver = () => document.visibilityState === "visible" && programar()

    correr()
    const limpiezas = [
      escuchar("project:diagram-updated", programar),
      escuchar("project:note-created", programar),
      escuchar(EVENTO.miembros, programar),
      escuchar<ChatSentDetail>(EVENTO.chatEnviado, (d) => d?.mencionaIa && sumarLogradas(yoId, ["PREGUNTAR_SENIOR_DEV"])),
      escuchar(EVENTO.exportado, () => sumarLogradas(yoId, ["EXPORTAR"])),
    ]
    document.addEventListener("visibilitychange", alVolver)
    return () => {
      clearTimeout(timer)
      limpiezas.forEach((off) => off())
      document.removeEventListener("visibilitychange", alVolver)
    }
  }, [activa, proyectoId, yoId, yoNombre])
}
