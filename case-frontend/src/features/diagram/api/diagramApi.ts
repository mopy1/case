import { apiFetch } from "@/lib/api"
import type {
  AtributoEntidadRequest,
  AtributoEntidadResponse,
  DiagramaResponse,
  EntidadDiagramaRequest,
  EntidadDiagramaResponse,
  PuntoControl,
  RelacionDiagramaRequest,
  RelacionDiagramaResponse,
} from "../types/diagram.types"

export function getDiagram(proyectoId: number): Promise<DiagramaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/diagrama`, { errorFallback: "Error al obtener el diagrama" })
}

export function createEntity(proyectoId: number, entidad: EntidadDiagramaRequest): Promise<EntidadDiagramaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/entidades`, {
    method: "POST",
    body: JSON.stringify(entidad),
    errorFallback: "Error al crear la tabla",
  })
}

export function updateEntity(
  proyectoId: number,
  entidadId: number,
  entidad: EntidadDiagramaRequest
): Promise<EntidadDiagramaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/entidades/${entidadId}`, {
    method: "PUT",
    body: JSON.stringify(entidad),
    errorFallback: "Error al actualizar la tabla",
  })
}

export function deleteEntity(proyectoId: number, entidadId: number): Promise<void> {
  return apiFetch(`/api/proyectos/${proyectoId}/entidades/${entidadId}`, {
    method: "DELETE",
    errorFallback: "Error al eliminar la tabla",
  })
}

export function createAttribute(
  proyectoId: number,
  entidadId: number,
  atributo: AtributoEntidadRequest
): Promise<AtributoEntidadResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/entidades/${entidadId}/atributos`, {
    method: "POST",
    body: JSON.stringify(atributo),
    errorFallback: "Error al crear el atributo",
  })
}

export function updateAttribute(
  proyectoId: number,
  entidadId: number,
  atributoId: number,
  atributo: AtributoEntidadRequest
): Promise<AtributoEntidadResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/entidades/${entidadId}/atributos/${atributoId}`, {
    method: "PUT",
    body: JSON.stringify(atributo),
    errorFallback: "Error al actualizar el atributo",
  })
}

export function deleteAttribute(proyectoId: number, entidadId: number, atributoId: number): Promise<void> {
  return apiFetch(`/api/proyectos/${proyectoId}/entidades/${entidadId}/atributos/${atributoId}`, {
    method: "DELETE",
    errorFallback: "Error al eliminar el atributo",
  })
}

export function createRelation(
  proyectoId: number,
  relacion: RelacionDiagramaRequest
): Promise<RelacionDiagramaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/relaciones`, {
    method: "POST",
    body: JSON.stringify(relacion),
    errorFallback: "Error al crear la relación",
  })
}

export function updateRelation(
  proyectoId: number,
  relacionId: number,
  relacion: RelacionDiagramaRequest
): Promise<RelacionDiagramaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/relaciones/${relacionId}`, {
    method: "PUT",
    body: JSON.stringify(relacion),
    errorFallback: "Error al actualizar la relación",
  })
}

export function deleteRelation(proyectoId: number, relacionId: number): Promise<void> {
  return apiFetch(`/api/proyectos/${proyectoId}/relaciones/${relacionId}`, {
    method: "DELETE",
    errorFallback: "Error al eliminar la relación",
  })
}

export function updateRelationPuntosControl(
  proyectoId: number,
  relacionId: number,
  puntos: PuntoControl[]
): Promise<RelacionDiagramaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/relaciones/${relacionId}/puntos`, {
    method: "PATCH",
    body: JSON.stringify({ puntos }),
    errorFallback: "Error al mover el punto de control",
  })
}
