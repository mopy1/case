import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { CollaborationMessage, CollaboratorPresence } from "../types/collaboration.types"
import { getColorForUser } from "../lib/collaborationUtils"
import { useDiagramPolling } from "./useDiagramPolling"

const INACTIVITY_TIMEOUT_MS = 8000
const HEARTBEAT_INTERVAL_MS = 3500

export function useRealtimeCollaboration(proyectoId: number) {
  useDiagramPolling(proyectoId)
  const { user } = useAuth()

  const clientId = useMemo(
    () => `${user?.id ?? "guest"}-${Math.random().toString(36).slice(2, 7)}`,
    [user?.id]
  )
  const username = user?.username || "Colaborador"
  const color = useMemo(() => getColorForUser(username + clientId), [username, clientId])

  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const collaboratorsMap = useRef<Map<string | number, CollaboratorPresence>>(new Map())
  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastCursorSentRef = useRef(0)

  const syncState = useCallback(() => {
    setCollaborators(Array.from(collaboratorsMap.current.values()))
  }, [])

  const post = useCallback((msg: CollaborationMessage) => {
    try {
      channelRef.current?.postMessage(msg)
    } catch {}
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`sw_collab_${proyectoId}`, JSON.stringify(msg))
      }
    } catch {}
  }, [proyectoId])

  const broadcastCursor = useCallback((x: number, y: number) => {
    const now = Date.now()
    if (now - lastCursorSentRef.current < 40) return
    lastCursorSentRef.current = now
    post({
      type: "CURSOR_MOVE",
      senderId: clientId,
      username,
      color,
      cursor: { x, y },
      timestamp: now,
    })
  }, [clientId, username, color, post])

  useEffect(() => {
    if (!proyectoId || typeof window === "undefined") return

    let channel: BroadcastChannel | null = null
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(`sw-case-collaboration-project-${proyectoId}`)
      channelRef.current = channel
    }

    const sendJoin = (isReply = false) => {
      post({
        type: "USER_JOIN", senderId: clientId, username, color,
        cursor: { x: 0, y: 0 }, selectedEntityId: null, timestamp: Date.now(), payload: { isReply },
      })
    }

    sendJoin(false)

    const handleMessageData = (msg: CollaborationMessage) => {
      if (!msg || msg.senderId === clientId) return
      if (msg.type === "USER_LEAVE") {
        collaboratorsMap.current.delete(msg.senderId)
        syncState()
        return
      }
      if (msg.type === "DIAGRAM_MUTATION") {
        window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId, remote: true } }))
        return
      }

      const existing = collaboratorsMap.current.get(msg.senderId)
      collaboratorsMap.current.set(msg.senderId, {
        id: msg.senderId,
        username: msg.username || existing?.username || "Colaborador",
        color: msg.color || existing?.color || "#2563eb",
        cursor: msg.cursor || existing?.cursor || { x: 0, y: 0 },
        selectedEntityId: msg.selectedEntityId ?? existing?.selectedEntityId ?? null,
        lastActive: Date.now(),
      })
      syncState()

      if (msg.type === "USER_JOIN" && !(msg.payload as { isReply?: boolean })?.isReply) {
        sendJoin(true)
      }
    }

    const onChannelMessage = (event: MessageEvent<CollaborationMessage>) => {
      handleMessageData(event.data)
    }
    channel?.addEventListener("message", onChannelMessage)

    const onStorage = (e: StorageEvent) => {
      if (e.key === `sw_collab_${proyectoId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as CollaborationMessage
          handleMessageData(parsed)
        } catch {}
      }
    }
    window.addEventListener("storage", onStorage)

    const heartbeatTimer = setInterval(() => sendJoin(true), HEARTBEAT_INTERVAL_MS)
    const cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - INACTIVITY_TIMEOUT_MS
      let changed = false
      for (const [id, c] of collaboratorsMap.current.entries()) {
        if (c.lastActive < cutoff) {
          collaboratorsMap.current.delete(id)
          changed = true
        }
      }
      if (changed) syncState()
    }, 2000)

    return () => {
      clearInterval(heartbeatTimer)
      clearInterval(cleanupTimer)
      post({ type: "USER_LEAVE", senderId: clientId, username, timestamp: Date.now() })
      channel?.removeEventListener("message", onChannelMessage)
      channel?.close()
      window.removeEventListener("storage", onStorage)
      channelRef.current = null
    }
  }, [proyectoId, clientId, username, color, post, syncState])

  return {
    collaborators,
    broadcastCursor,
    myPresence: { id: clientId, username, color },
  }
}
