import { useCallback, useEffect, useRef } from "react"
import type { CollaboratorPresence } from "../types/collaboration.types"
import { syncPresenceApi } from "../api/collaborationApi"

const HTTP_HEARTBEAT_MS = 800
const THROTTLE_PUSH_MS = 250

interface UseHttpPresenceProps {
  proyectoId: number
  clientId: string
  username: string
  color: string
  cursorRef: React.MutableRefObject<{ x: number; y: number }>
  onSync: (collaborators: CollaboratorPresence[]) => void
}

export function useHttpPresence({
  proyectoId,
  clientId,
  username,
  color,
  cursorRef,
  onSync,
}: UseHttpPresenceProps) {
  const lastPushRef = useRef(0)
  const isMountedRef = useRef(true)

  const syncWithServer = useCallback(async () => {
    if (!proyectoId || Number.isNaN(proyectoId)) return
    try {
      const remote = await syncPresenceApi(proyectoId, {
        clientId,
        username,
        color,
        cursor: cursorRef.current || { x: 0, y: 0 },
      })
      if (isMountedRef.current && Array.isArray(remote)) {
        onSync(remote)
      }
    } catch {
      // Error de red transitorio silencioso
    }
  }, [proyectoId, clientId, username, color, cursorRef, onSync])

  const triggerPush = useCallback(() => {
    const now = Date.now()
    if (now - lastPushRef.current < THROTTLE_PUSH_MS) return
    lastPushRef.current = now
    void syncWithServer()
  }, [syncWithServer])

  useEffect(() => {
    isMountedRef.current = true
    void syncWithServer()

    const timer = setInterval(() => {
      void syncWithServer()
    }, HTTP_HEARTBEAT_MS)

    return () => {
      isMountedRef.current = false
      clearInterval(timer)
    }
  }, [syncWithServer])

  return { triggerPush }
}
