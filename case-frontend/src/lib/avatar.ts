// Paleta de identidad de avatares: única excepción documentada a la regla de tokens semánticos.
const COLORES_AVATAR = [
  "bg-red-500/15 text-red-700 dark:text-red-300",
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
]

/** Color estable por identificador (usuarioId): dos personas con las mismas iniciales se distinguen. */
export function colorAvatar(identificador: string | number) {
  const str = String(identificador)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length]
}

/** Iniciales: primera letra de los dos primeros segmentos (`_ . -` o espacio), sin dígitos. */
export function iniciales(username: string) {
  const segmentos = username.replace(/\d+/g, "").split(/[_.\-\s]+/).filter(Boolean)
  if (segmentos.length >= 2) return (segmentos[0][0] + segmentos[1][0]).toUpperCase()
  return (segmentos[0] ?? username).slice(0, 2).toUpperCase()
}
