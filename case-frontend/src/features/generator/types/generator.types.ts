export interface ArchivoGenerado {
  ruta: string
  contenido: string
  tipo: "JAVA" | "CONFIG" | "DOC"
}

export interface GeneradorPreviewResponse {
  nombreProyecto: string
  totalArchivos: number
  entidades: string[]
  archivos: ArchivoGenerado[]
}
