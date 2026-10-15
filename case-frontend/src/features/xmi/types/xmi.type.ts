export type ModoImportacionXmi = "FUSIONAR" | "REEMPLAZAR"

export interface XmiPreviewResponse {
  dialectoDetectado: string
  tablas: string[]
  tablasExistentes: string[]
  totalRelaciones: number
  totalEntidadesActuales: number
}
