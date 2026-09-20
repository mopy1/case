import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { CollaborationMessage, CollaboratorPresence } from "../types/collaboration.types"
import { getColorForUser, getStableClientId } from "../lib/collaborationUtils"
import { useDiagramPolling } from "./useDiagramPolling"
import { useHttpPresence } from "./useHttpPresence"

const HEARTBEAT_MS = 3000

export function useRealtimeCollaboration(proyectoId: number) {
  useDiagramPolling(proyectoId)
  const { user } = useAuth()

  const clientId = useMemo(() => getStableClientId(user?.id), [user?.id])
  const username = user?.username || "Colaborador"
  const color = useMemo(() => getColorForUser(username), [username])

  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const collaboratorsMap = useRef<Map<string | number, CollaboratorPresence>>(new Map())
  const channelRef = useRef<BroadcastChannel | null>(null)
  const cursorRef = useRef({ x: 0, y: 0 })
  const lastBroadcastRef = useRef(0)

  const syncState = useCallback(() => {
    setCollaborators(Array.from(collaboratorsMap.current.values()))
  }, [])

  const handleHttpSync = useCallback((remote: CollaboratorPresence[]) => {
    const remoteMap = new Map<string, CollaboratorPresence>()
    for (const r of remote) {
      if (String(r.id) === clientId) continue
      remoteMap.set(String(r.id), r)
    }

    let changed = false
    for (const [id, r] of remoteMap) {
      const prev = collaboratorsMap.current.get(id)
      if (!prev || prev.cursor?.x !== r.cursor?.x || prev.cursor?.y !== r.cursor?.y) {
        collaboratorsMap.current.set(id, {
          id: r.id,
          username: r.username,
          color: r.color,
          cursor: r.cursor || { x: 0, y: 0 },
          selectedEntityId: r.selectedEntityId ?? null,
          lastActive: Date.now(),
        })
        changed = true
      } else {
        prev.lastActive = Date.now()
      }
    }

    for (const id of Array.from(collaboratorsMap.current.keys())) {
      if (!remoteMap.has(String(id))) {
        collaboratorsMap.current.delete(id)
        changed = true
      }
    }

    if (changed) syncState()
  }, [clientId, syncState])

  const { triggerPush } = useHttpPresence({
    proyectoId, clientId, username, color, cursorRef, onSync: handleHttpSync,
  })

  const broadcastCursor = useCallback((x: number, y: number) => {
    cursorRef.current = { x, y }
    const now = Date.now()
    if (now - lastBroadcastRef.current >= 40) {
      lastBroadcastRef.current = now
      try {
        channelRef.current?.postMessage({
          type: "CURSOR_MOVE", senderId: clientId, username, color, cursor: { x, y }, timestamp: now,
        })
      } catch {}
    }
    triggerPush()
  }, [clientId, username, color, triggerPush])

  useEffect(() => {
    if (!proyectoId || typeof window === "undefined" || !("BroadcastChannel" in window)) return
    const channel = new BroadcastChannel(`sw-case-collab-${proyectoId}`)
    channelRef.current = channel

    const sendPing = () => {
      try {
        channel.postMessage({
          type: "USER_JOIN", senderId: clientId, username, color, cursor: cursorRef.current, timestamp: Date.now(),
        })
      } catch {}
    }
    sendPing()

    const onMessage = (e: MessageEvent<CollaborationMessage>) => {
      const msg = e.data
      if (!msg || msg.senderId === clientId) return
      if (msg.type === "USER_LEAVE") {
        collaboratorsMap.current.delete(msg.senderId)
        syncState()
        return
      }
      collaboratorsMap.current.set(msg.senderId, {
        id: msg.senderId,
        username: msg.username,
        color: msg.color || "#2563eb",
        cursor: msg.cursor || { x: 0, y: 0 },
        selectedEntityId: msg.selectedEntityId ?? null,
        lastActive: Date.now(),
      })
      syncState()
    }

    channel.addEventListener("message", onMessage)
    const hb = setInterval(sendPing, HEARTBEAT_MS)

    return () => {
      clearInterval(hb)
      channel.removeEventListener("message", onMessage)
      try {
        channel.postMessage({ type: "USER_LEAVE", senderId: clientId, timestamp: Date.now() })
        channel.close()
      } catch {}
      channelRef.current = null
    }
  }, [proyectoId, clientId, username, color, syncState])

  return {
    collaborators,
    broadcastCursor,
    myPresence: { id: clientId, username, color },
  }
}
