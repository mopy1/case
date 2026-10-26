import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { ProyectoRequest } from "../types/projects.type"

/** Misión 1 de la Guía: el usuario crea su propio proyecto de práctica (prellenado, editable). */
export const PRACTICA: ProyectoRequest = {
  nombre: "Práctica — Biblioteca",
  descripcion: "Proyecto de práctica para la inducción: Libro, Autor y Préstamo.",
}

/**
 * `?nuevo=practica` (Guía › "Llevarme ahí"): abre el diálogo de nuevo proyecto con la sugerencia.
 * Se lee una vez al montar (el diálogo se monta recién cuando termina la carga) y se apaga al crear:
 * si no, el diálogo de la grilla se volvería a abrir solo al pasar de 0 a 1 proyecto.
 */
export function usePracticaQuery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [abrirPractica, setAbrirPractica] = useState(() => searchParams.get("nuevo") === "practica")

  useEffect(() => {
    if (searchParams.has("nuevo")) setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  return { abrirPractica, apagarPractica: () => setAbrirPractica(false) }
}
