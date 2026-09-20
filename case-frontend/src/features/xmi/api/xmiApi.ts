import { apiFetch } from "@/lib/api"

export async function exportXmi(proyectoId: number): Promise<Blob> {
  const response = await apiFetch<Response>(`/api/proyectos/${proyectoId}/xmi/exportar`, {
    raw: true,
    errorFallback: "Error al exportar el XMI",
  })
  return response.blob()
}

/** El backend devuelve el lienzo completo ya actualizado, pero esta feature no lo necesita — tras
 * importar se navega a `/diagrama`, que hace su propio fetch fresco (ver `useXmiExchange`). */
export function importXmi(proyectoId: number, archivo: File): Promise<void> {
  const formData = new FormData()
  formData.append("archivo", archivo)
  return apiFetch(`/api/proyectos/${proyectoId}/xmi/importar`, {
    method: "POST",
    body: formData,
    errorFallback: "Error al importar el XMI",
  })
}
