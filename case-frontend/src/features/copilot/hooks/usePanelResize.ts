import { useEffect, useState } from "react"

const WIDTH_STORAGE_KEY = "sw_case_copilot_width"
const DEFAULT_WIDTH = 350
const MIN_WIDTH = 280
const MAX_WIDTH = 720

export function usePanelResize() {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(WIDTH_STORAGE_KEY)
    const parsed = saved ? Number(saved) : DEFAULT_WIDTH
    return Number.isFinite(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH ? parsed : DEFAULT_WIDTH
  })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      setWidth(Math.min(Math.max(window.innerWidth - e.clientX, MIN_WIDTH), MAX_WIDTH))
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging])

  useEffect(() => {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width))
  }, [width])

  return {
    width,
    setWidth,
    isDragging,
    setIsDragging,
    resetWidth: () => setWidth(DEFAULT_WIDTH),
  }
}
