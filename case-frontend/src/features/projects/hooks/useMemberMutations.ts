import { useState } from "react"
import type { MiembroProyectoRequest, RolProyecto } from "../types/projects.type"
import {
  addMember as addMemberRequest,
  changeMemberRole as changeMemberRoleRequest,
  removeMember as removeMemberRequest,
} from "../api/projectsApi"
import { mensajeDeError } from "@/lib/api"
import { notificarMiembros } from "@/features/guia"

export function useMemberMutations(proyectoId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      const resultado = await action()
      notificarMiembros(proyectoId)
      return resultado
    } catch (err) {
      setError(mensajeDeError(err))
      return null
    } finally {
      setLoading(false)
    }
  }

  const addMember = (miembro: MiembroProyectoRequest) => run(() => addMemberRequest(proyectoId, miembro))
  const changeRole = (usuarioObjetivoId: number, rol: RolProyecto) =>
    run(() => changeMemberRoleRequest(proyectoId, usuarioObjetivoId, rol))
  const removeMember = (usuarioObjetivoId: number) => run(() => removeMemberRequest(proyectoId, usuarioObjetivoId))

  return { addMember, changeRole, removeMember, loading, error }
}
