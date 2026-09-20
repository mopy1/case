import type { RolProyecto } from "../../types/projects.type"

export const ROLES: { value: RolProyecto; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "COLABORADOR", label: "Colaborador" },
  { value: "LECTOR", label: "Lector" },
]
