import { useEffect, useState } from "react"

export interface VisualViewportState {
  viewportHeight: number
  isKeyboardOpen: boolean
}

/**
 * Hook para sincronizar reactivamente el alto visible del viewport cuando el
 * teclado virtual de dispositivos móviles (iOS/Android) se abre o se cierra.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === "undefined") {
      return { viewportHeight: 800, isKeyboardOpen: false }
    }
    const h = window.visualViewport?.height ?? window.innerHeight
    return { viewportHeight: h, isKeyboardOpen: false }
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const update = () => {
      const vv = window.visualViewport
      const currentHeight = vv ? vv.height : window.innerHeight
      const diff = window.innerHeight - currentHeight
      const keyboardOpen = diff > 140

      document.documentElement.style.setProperty("--visual-viewport-height", `${currentHeight}px`)
      document.documentElement.style.setProperty("--keyboard-height", `${Math.max(0, diff)}px`)

      setState({
        viewportHeight: currentHeight,
        isKeyboardOpen: keyboardOpen,
      })
    }

    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener("resize", update)
      vv.addEventListener("scroll", update)
    }
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)

    update()

    return () => {
      if (vv) {
        vv.removeEventListener("resize", update)
        vv.removeEventListener("scroll", update)
      }
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
    }
  }, [])

  return state
}
