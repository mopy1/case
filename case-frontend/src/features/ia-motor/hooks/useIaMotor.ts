import { useEffect, useSyncExternalStore } from "react"
import { obtenerIaMotor, registrarVigia, suscribirIaMotor } from "../lib/iaMotorStore"

/**
 * Motor de IA elegido (compartido por todas las cabeceras). Con `vigilar` el componente cuenta como
 * selector montado: mientras haya alguno se re-sincroniza con el backend y se re-prueba la salud de Kaggle.
 */
export function useIaMotor({ vigilar = false }: { vigilar?: boolean } = {}) {
  const snapshot = useSyncExternalStore(suscribirIaMotor, obtenerIaMotor)
  useEffect(() => (vigilar ? registrarVigia() : undefined), [vigilar])
  return snapshot
}
