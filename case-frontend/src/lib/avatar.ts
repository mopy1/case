const COLORES_AVATAR = [
  "bg-red-900/70 text-red-200",
  "bg-blue-900/70 text-blue-200",
  "bg-emerald-900/70 text-emerald-200",
  "bg-amber-900/70 text-amber-200",
  "bg-purple-900/70 text-purple-200",
  "bg-cyan-900/70 text-cyan-200",
]

export function colorAvatar(identificador: string | number) {
  const str = String(identificador)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORES_AVATAR[Math.abs(hash) % COLORES_AVATAR.length]
}

export function iniciales(username: string) {
  return username.slice(0, 2).toUpperCase()
}
