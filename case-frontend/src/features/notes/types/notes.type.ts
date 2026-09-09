export interface NotaRequest {
  accion: string
  motivo: string
}

export interface NotaResponse {
  id: number
  usuarioId: number
  username: string
  accion: string
  motivo: string
  createdAt: string
}
