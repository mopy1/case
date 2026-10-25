import { useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { mostrarPasos } from "../lib/guiaEventos"
import type { MisionDef } from "../types/guia.types"

/** "Llevarme ahí": ruta absoluta (misión 1), coach marks (navegan solos) o sección del proyecto. */
export function useIrAMision() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  return useCallback(
    (mision: MisionDef) => {
      if (mision.href) navigate(mision.href)
      else if (mision.pasos) mostrarPasos(mision.pasos)
      else if (mision.ruta && id) navigate(`/proyectos/${id}/${mision.ruta}`)
    },
    [navigate, id]
  )
}
