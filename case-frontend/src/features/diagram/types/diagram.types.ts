export interface AtributoEntidadResponse {
  id: number
  entidadId: number
  nombre: string
  tipoSql: string
  esPk: boolean
  esFk: boolean
  referenciaEntidadId: number | null
  referenciaEntidadNombre: string | null
  nullable: boolean
}

export interface EntidadDiagramaResponse {
  id: number
  proyectoId: number
  nombre: string
  posX: number
  posY: number
  atributos: AtributoEntidadResponse[]
  createdAt: string
}

export interface EntidadDiagramaRequest {
  nombre: string
  posX: number
  posY: number
}

export interface AtributoEntidadRequest {
  nombre: string
  tipoSql: string
  esPk: boolean
  esFk: boolean
  referenciaEntidadId: number | null
  nullable: boolean
}

/**
 * Multiplicidad de un solo lado de una relación — guardada de forma independiente por lado
 * (2026-09-19, reemplaza a `TipoRelacion` + `opcionalOrigen`/`opcionalDestino`). Ver
 * `lib/multiplicidad.ts` para los helpers derivados (¿es N:M?, texto a mostrar, etc.).
 */
export type LadoMultiplicidad = "UNO" | "CERO_O_UNO" | "UNO_O_MAS" | "CERO_O_MAS"

export type TipoRelacionUml = "ASOCIACION" | "COMPOSICION" | "AGREGACION" | "HERENCIA"

/** Un punto de control manual sobre una relación (Ctrl+arrastrar la línea para agregar, arrastrar
 * el punto para moverlo, Ctrl+click para quitarlo — ver `UmlRelationEdge`/`PuntoControlHandle`).
 * Coordenadas en flow-space del lienzo. */
export interface PuntoControl {
  x: number
  y: number
}

export interface RelacionDiagramaResponse {
  id: number
  proyectoId: number
  entidadOrigenId: number
  entidadOrigenNombre: string
  entidadDestinoId: number
  entidadDestinoNombre: string
  multiplicidadOrigen: LadoMultiplicidad
  multiplicidadDestino: LadoMultiplicidad
  puntosControl: PuntoControl[]
  tipo?: TipoRelacionUml
}

export interface RelacionDiagramaRequest {
  entidadOrigenId: number
  entidadDestinoId: number
  multiplicidadOrigen: LadoMultiplicidad
  multiplicidadDestino: LadoMultiplicidad
  tipo?: TipoRelacionUml
}

export interface DiagramaResponse {
  entidades: EntidadDiagramaResponse[]
  relaciones: RelacionDiagramaResponse[]
}
