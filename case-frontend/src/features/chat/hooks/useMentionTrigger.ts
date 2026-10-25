import { useCallback, useMemo, useState } from "react"
import type { MentionItem, MentionTriggerState } from "../types/mention.types"

const MENTION_REGEX = /(?:^|\s)@([a-zA-Z0-9_-]*)$/

interface UseMentionTriggerOptions {
  candidatos: MentionItem[]
  texto: string
  setTexto: (nuevo: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

/**
 * Hook para detección de mención activa (@query), filtrado y navegación con teclado.
 */
export function useMentionTrigger({
  candidatos,
  texto,
  setTexto,
  textareaRef,
}: UseMentionTriggerOptions) {
  const [trigger, setTrigger] = useState<MentionTriggerState>({
    activo: false,
    query: "",
    posicionInicio: 0,
    posicionCursor: 0,
  })
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0)

  const filtrados = useMemo(() => {
    if (!trigger.activo) return []
    const q = trigger.query.toLowerCase()
    return candidatos.filter((c) => c.username.toLowerCase().includes(q))
  }, [candidatos, trigger.activo, trigger.query])

  const verificarMencion = useCallback((valor: string, cursorPos: number) => {
    const prefijo = valor.slice(0, cursorPos)
    const match = prefijo.match(MENTION_REGEX)

    if (match) {
      const query = match[1] ?? ""
      const inicio = cursorPos - query.length - 1
      setTrigger({ activo: true, query, posicionInicio: inicio, posicionCursor: cursorPos })
      setIndiceSeleccionado(0)
    } else {
      setTrigger((prev) => (prev.activo ? { ...prev, activo: false } : prev))
    }
  }, [])

  const cerrarPopover = useCallback(() => {
    setTrigger((prev) => ({ ...prev, activo: false }))
    setIndiceSeleccionado(0)
  }, [])

  const insertarMencion = useCallback(
    (item: MentionItem) => {
      const textarea = textareaRef.current
      const antes = texto.slice(0, trigger.posicionInicio)
      const despues = texto.slice(trigger.posicionCursor)
      const mencion = `@${item.username} `
      const nuevoTexto = `${antes}${mencion}${despues}`
      const nuevaPos = antes.length + mencion.length

      setTexto(nuevoTexto)
      cerrarPopover()
      setTimeout(() => {
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(nuevaPos, nuevaPos)
        }
      }, 0)
    },
    [cerrarPopover, setTexto, texto, textareaRef, trigger.posicionCursor, trigger.posicionInicio]
  )

  const manejarKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!trigger.activo) return false
      if (e.key === "Escape") {
        e.preventDefault()
        cerrarPopover()
        return true
      }
      if (filtrados.length === 0) return false
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setIndiceSeleccionado((prev) => (prev + 1) % filtrados.length)
        return true
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setIndiceSeleccionado((prev) => (prev - 1 + filtrados.length) % filtrados.length)
        return true
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const elegido = filtrados[indiceSeleccionado] ?? filtrados[0]
        if (elegido) insertarMencion(elegido)
        return true
      }
      return false
    },
    [cerrarPopover, filtrados, indiceSeleccionado, insertarMencion, trigger.activo]
  )

  return {
    activo: trigger.activo,
    query: trigger.query,
    filtrados,
    indiceSeleccionado,
    setIndiceSeleccionado,
    verificarMencion,
    cerrarPopover,
    insertarMencion,
    manejarKeyDown,
  }
}
