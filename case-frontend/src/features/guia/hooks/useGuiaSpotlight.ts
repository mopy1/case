import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/useIsMobile"
import { abrirPanel, cerrarPanel, escuchar, EVENTO } from "../lib/guiaEventos"
import { GUIA_PASOS } from "../lib/guiaPasos.data"
import type { GuiaPasoDetail, GuiaPasoId } from "../types/guia.types"

const INTERVALO_MS = 100
const ESPERA_MAX_MS = 2000
const ATRIBUTO = "data-guia-activo"

/** Primer elemento visible con ese `data-guia` (puede haber copias ocultas, p. ej. en la vista inactiva). */
function buscarVisible(id: GuiaPasoId): HTMLElement | null {
  const todos = document.querySelectorAll<HTMLElement>(`[data-guia="${id}"]`)
  return [...todos].find((el) => el.getClientRects().length > 0) ?? null
}

/** Coach marks: `guia:paso` → navega, abre/cierra el panel, espera el elemento y lo resalta. */
export function useGuiaSpotlight() {
  const [pasos, setPasos] = useState<GuiaPasoId[]>([])
  const [indice, setIndice] = useState(0)
  const [elemento, setElemento] = useState<HTMLElement | null>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { id } = useParams<{ id: string }>()
  const isMobile = useIsMobile()
  const paso = pasos[indice] ? GUIA_PASOS[pasos[indice]] : undefined

  const cerrar = useCallback(() => {
    setPasos([])
    setIndice(0)
    setElemento(null)
  }, [])

  useEffect(
    () =>
      escuchar<GuiaPasoDetail>(EVENTO.paso, (d) => {
        setElemento(null)
        setIndice(0)
        setPasos(d?.pasos ?? [])
      }),
    []
  )

  // Prepara la pantalla del paso actual. Depende solo de `paso` a propósito: navegar al entrar, no en cada cambio de URL.
  useEffect(() => {
    if (!paso) return
    if (paso.ruta && !pathname.includes(`/${paso.ruta}`)) navigate(`/proyectos/${id}/${paso.ruta}`)
    if (paso.zona === "panel") abrirPanel(paso.tab ?? "copilot")
    else if (isMobile) cerrarPanel()
  }, [paso]) // eslint-disable-line react-hooks/exhaustive-deps

  // Espera a que el elemento exista y sea visible (puede montarse con React.lazy).
  useEffect(() => {
    if (!paso) return
    const inicio = Date.now()
    const timer = setInterval(() => {
      const el = buscarVisible(paso.id)
      if (el) {
        clearInterval(timer)
        const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        el.scrollIntoView({ block: "center", behavior: reducir ? "auto" : "smooth" })
        el.setAttribute(ATRIBUTO, "true")
        setElemento(el)
      } else if (Date.now() - inicio > ESPERA_MAX_MS) {
        clearInterval(timer)
        toast(paso.ayudaSiFalta ?? "Ese botón no está visible en esta pantalla.")
        cerrar()
      }
    }, INTERVALO_MS)
    return () => clearInterval(timer)
  }, [paso, cerrar])

  // Quita el anillo al avanzar o cerrar.
  useEffect(() => () => elemento?.removeAttribute(ATRIBUTO), [elemento])

  const siguiente = useCallback(() => {
    setElemento(null)
    if (indice + 1 < pasos.length) setIndice(indice + 1)
    else cerrar()
  }, [indice, pasos.length, cerrar])

  return { paso, elemento, indice, total: pasos.length, siguiente, cerrar }
}
