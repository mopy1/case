const COLLABORATOR_COLORS = [
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#ea580c",
  "#0d9488",
  "#4f46e5",
]

export function getColorForUser(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length
  return COLLABORATOR_COLORS[index]
}

export function getInitials(name: string): string {
  const clean = name.trim()
  if (!clean) return "U"
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

export function getStableClientId(userId: string | number | undefined): string {
  if (typeof window === "undefined") return "guest-default"
  const key = `sw_case_client_id_${userId ?? "guest"}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const newId = `${userId ?? "guest"}-${Math.random().toString(36).slice(2, 7)}`
    sessionStorage.setItem(key, newId)
    return newId
  } catch {
    return `${userId ?? "guest"}-${Math.random().toString(36).slice(2, 7)}`
  }
}
