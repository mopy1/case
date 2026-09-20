import type { MiembroProyectoRequest, MiembroProyectoResponse, ProyectoRequest, ProyectoResponse, RolProyecto, listarProyectosResponse } from "../types/projects.type"
import { apiFetch } from "@/lib/api"

const PROJECTS_URL = "/api/proyectos"

export function getMyProjects(): Promise<listarProyectosResponse[]> {
  return apiFetch(PROJECTS_URL, { errorFallback: "Error al obtener proyectos" })
}

export function getProject(id: number): Promise<ProyectoResponse> {
  return apiFetch(`${PROJECTS_URL}/${id}`, { errorFallback: "Error al obtener el proyecto" })
}

export function createProject(project: ProyectoRequest): Promise<ProyectoResponse> {
  return apiFetch(PROJECTS_URL, {
    method: "POST",
    body: JSON.stringify(project),
    errorFallback: "Error al crear proyecto",
  })
}

export function deleteProject(id: number): Promise<void> {
  return apiFetch(`${PROJECTS_URL}/${id}`, { method: "DELETE", errorFallback: "Error al eliminar proyecto" })
}

export function getProjectMembers(proyectoId: number): Promise<MiembroProyectoResponse[]> {
  return apiFetch(`${PROJECTS_URL}/${proyectoId}/miembros`, { errorFallback: "Error al obtener miembros del proyecto" })
}

export function addMember(proyectoId: number, miembro: MiembroProyectoRequest): Promise<MiembroProyectoResponse> {
  return apiFetch(`${PROJECTS_URL}/${proyectoId}/miembros`, {
    method: "POST",
    body: JSON.stringify(miembro),
    errorFallback: "Error al agregar miembro al proyecto",
  })
}

export function changeMemberRole(
  proyectoId: number,
  usuarioObjetivoId: number,
  rol: RolProyecto
): Promise<MiembroProyectoResponse> {
  return apiFetch(`${PROJECTS_URL}/${proyectoId}/miembros/${usuarioObjetivoId}/rol`, {
    method: "PATCH",
    body: JSON.stringify({ rol }),
    errorFallback: "Error al cambiar el rol del colaborador",
  })
}

export function removeMember(proyectoId: number, usuarioObjetivoId: number): Promise<void> {
  return apiFetch(`${PROJECTS_URL}/${proyectoId}/miembros/${usuarioObjetivoId}`, {
    method: "DELETE",
    errorFallback: "Error al quitar al colaborador",
  })
}
