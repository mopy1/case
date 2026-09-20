import { apiFetch } from "@/lib/api"
import type { GeneradorPreviewResponse } from "../types/generator.types"

export const generatorApi = {
  async obtenerPreview(proyectoId: number): Promise<GeneradorPreviewResponse> {
    return apiFetch<GeneradorPreviewResponse>(`/api/proyectos/${proyectoId}/generador/preview`, {
      errorFallback: "Error al generar la vista previa del backend",
    })
  },

  async descargarZip(proyectoId: number, nombreProyecto?: string): Promise<void> {
    const response = await apiFetch<Response>(`/api/proyectos/${proyectoId}/generador/descargar`, {
      raw: true,
      errorFallback: "Error al descargar el archivo ZIP del backend",
    })

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    const filename = `${nombreProyecto ? nombreProyecto.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "proyecto"}-backend.zip`

    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },
}
