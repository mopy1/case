import { useCallback, useEffect, useState } from "react"
import { mensajeDeError } from "@/lib/api"
import { descargarBlob } from "@/lib/descargarArchivo"
import { obtenerDdl } from "../api/ddlApi"

/** DDL del modelo: se pide al montar (el visor se monta al abrirse) y se puede recargar o descargar como `.sql`. */
export function useDdlEsquema(proyectoId: number) {
  const [ddl, setDdl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDdl(await obtenerDdl(proyectoId))
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo generar el DDL del modelo"))
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  // Carga inicial (el visor se monta al abrirse); `vigente` evita escribir estado tras desmontar.
  useEffect(() => {
    let vigente = true
    obtenerDdl(proyectoId)
      .then((texto) => vigente && setDdl(texto))
      .catch((err) => vigente && setError(mensajeDeError(err, "No se pudo generar el DDL del modelo")))
      .finally(() => vigente && setLoading(false))
    return () => {
      vigente = false
    }
  }, [proyectoId])

  const descargar = useCallback(() => {
    if (ddl) descargarBlob(new Blob([ddl], { type: "text/sql;charset=utf-8" }), `esquema-${proyectoId}.sql`)
  }, [ddl, proyectoId])

  /** El backend devuelve solo un comentario si el diagrama no tiene tablas. */
  const vacio = ddl !== null && !/\bCREATE TABLE\b/i.test(ddl)

  return { ddl, loading, error, vacio, recargar, descargar }
}
