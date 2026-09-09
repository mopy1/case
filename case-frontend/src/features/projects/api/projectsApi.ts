import type { MiembroProyectoRequest, MiembroProyectoResponse, ProyectoRequest, ProyectoResponse, listarProyectosResponse } from "../types/projects.type"
import { API_URL } from "@/lib/api"

const PROJECTS_URL = `${API_URL}/api/proyectos`

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null)
  return error?.message ?? fallback
}

export async function getMyProjects(): Promise<listarProyectosResponse[]> {
  const token = localStorage.getItem("token")
  const response = await fetch(`${PROJECTS_URL}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al obtener proyectos"))
  }

  return response.json()
}

export async function getProject(id: number): Promise<ProyectoResponse> {
  const token = localStorage.getItem("token")
  const response = await fetch(`${PROJECTS_URL}/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al obtener el proyecto"))
  }

  return response.json()
}

export async function createProject(project: ProyectoRequest): Promise<ProyectoResponse> {
  const token = localStorage.getItem("token")
  const response = await fetch(`${PROJECTS_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(project)
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al crear proyecto"))
  }

  return response.json()
}

export async function deleteProject(id: number): Promise<void> {
  const token = localStorage.getItem("token")
  const response = await fetch(`${PROJECTS_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al eliminar proyecto"))
  }
}

export async function miembrosProject(proyectoId: number): Promise<MiembroProyectoResponse[]> {
  const token = localStorage.getItem("token")
  const response = await fetch(`${PROJECTS_URL}/${proyectoId}/miembros`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al obtener miembros del proyecto"))
  }

  return response.json()
}

export async function agregarMiembro(proyectoId: number, miembro: MiembroProyectoRequest): Promise<MiembroProyectoResponse> {
  const token = localStorage.getItem("token")
  const response = await fetch(`${PROJECTS_URL}/${proyectoId}/miembros`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(miembro),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al agregar miembro al proyecto"))
  }

  return response.json()
}
