import { useState } from "react"
import type { MiembroProyectoRequest, RolProyecto } from "../types/projects.type"
import {
  addMember as addMemberRequest,
  changeMemberRole as changeMemberRoleRequest,
  removeMember as removeMemberRequest,
} from "../api/projectsApi"

export function useMemberMutations(proyectoId: number) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setLoading(true)
    setError(null)
    try {
      return await action()
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
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
