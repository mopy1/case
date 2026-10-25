import { useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useIsMobile } from "@/hooks/useIsMobile"
import { abrirGuia } from "../lib/guiaEventos"
import { actualizarProgreso, obtenerGuia } from "../lib/guiaStore"
import { useGuiaProgreso } from "./useGuiaProgreso"

/** Con ≥ 5 misiones ya hechas (usuario veterano) no se ofrece. */
const MINIMO_VETERANO = 5

/** Oferta única: al terminar la primera detección, abre la Guía (escritorio) o muestra un toast (móvil). */
export function useGuiaOferta() {
  const userId = useAuth().user?.id
  const { progreso, detectado, persistente } = useGuiaProgreso()
  const isMobile = useIsMobile()
  const toca = !!userId && detectado && persistente && progreso.estado === "pendiente" && !progreso.ofrecida

  useEffect(() => {
    // Se relee el store: en StrictMode el efecto corre dos veces con el mismo `toca`.
    if (!toca || !userId || obtenerGuia(userId).progreso.ofrecida) return
    actualizarProgreso(userId, (p) => ({ ...p, ofrecida: true }))
    if (progreso.logradas.length >= MINIMO_VETERANO) return
    if (!isMobile) {
      abrirGuia()
      return
    }
    toast("Tenés una guía de primeros pasos", {
      action: { label: "Ver primeros pasos", onClick: () => abrirGuia() },
      duration: 8000,
    })
  }, [toca, userId, isMobile, progreso.logradas.length])
}
