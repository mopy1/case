const STORAGE_PREFIX = "swcase_applied_proposals_"

function getStorageKey(proyectoId: number): string {
  return `${STORAGE_PREFIX}${proyectoId}`
}

export function getAppliedProposals(proyectoId: number): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(getStorageKey(proyectoId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => !isNaN(n)) : []
  } catch (err) {
    console.error("Error reading applied proposals from localStorage:", err)
    return []
  }
}

export function isProposalApplied(proyectoId: number, messageId: number): boolean {
  const ids = getAppliedProposals(proyectoId)
  return ids.includes(messageId)
}

export function markProposalApplied(proyectoId: number, messageId: number): void {
  if (typeof window === "undefined") return
  try {
    const ids = getAppliedProposals(proyectoId)
    if (!ids.includes(messageId)) {
      ids.push(messageId)
      localStorage.setItem(getStorageKey(proyectoId), JSON.stringify(ids))
    }
  } catch (err) {
    console.error("Error saving applied proposal to localStorage:", err)
  }
}
