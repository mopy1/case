import { useLayoutEffect } from "react"
import type { RefObject } from "react"

/** Altura automática del textarea (respaldo de `field-sizing: content`, que Firefox aún no soporta). */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string, max = 192) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }, [ref, value, max])
}
