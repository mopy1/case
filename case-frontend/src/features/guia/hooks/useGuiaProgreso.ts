import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useAuth } from "@/hooks/useAuth"
import { abrirGuia } from "../lib/guiaEventos"
import { MISION_IDS } from "../lib/guiaMisiones.data"
import { actualizarProgreso, obtenerGuia, SNAPSHOT_VACIO, suscribirGuia } from "../lib/guiaStore"
import type { GuiaProgreso, MisionId } from "../types/guia.types"

/** Progreso de la inducción del usuario logueado + acciones de la tarjeta. */
export function useGuiaProgreso() {
  const userId = useAuth().user?.id
  const snap = useSyncExternalStore(suscribirGuia, () => (userId ? obtenerGuia(userId) : SNAPSHOT_VACIO))

  const cambiar = useCallback(
    (fn: (p: GuiaProgreso) => GuiaProgreso) => {
      if (userId) actualizarProgreso(userId, fn)
    },
    [userId]
  )

  const acciones = useMemo(
    () => ({
      omitir: () => cambiar((p) => ({ ...p, estado: "omitida" })),
      verMasTarde: () => cambiar((p) => ({ ...p, colapsada: true })),
      mostrar: () => cambiar((p) => ({ ...p, colapsada: false })),
      cerrar: () => cambiar((p) => ({ ...p, estado: "completada" })),
      /** Menú de usuario › "Primeros pasos". */
      reabrir: () => {
        cambiar((p) => ({ ...p, estado: "pendiente", colapsada: false }))
        abrirGuia()
      },
    }),
    [cambiar]
  )

  const pendientes: MisionId[] = MISION_IDS.filter((id) => !snap.progreso.logradas.includes(id))
  return { ...snap, pendientes, ...acciones }
}
