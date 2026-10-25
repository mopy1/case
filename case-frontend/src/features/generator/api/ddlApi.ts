import { apiFetch } from "@/lib/api"

/** DDL PostgreSQL determinístico generado por el backend desde el diagrama (`text/plain`). */
export async function obtenerDdl(proyectoId: number): Promise<string> {
  const response = await apiFetch<Response>(`/api/proyectos/${proyectoId}/ddl`, {
    raw: true,
    errorFallback: "No se pudo generar el DDL del modelo",
  })
  return response.text()
}
