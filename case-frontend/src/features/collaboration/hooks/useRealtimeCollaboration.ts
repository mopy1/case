import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { CollaborationMessage, CollaboratorPresence } from "../types/collaboration.types"
import { getColorForUser } from "../lib/collaborationUtils"
import { useDiagramPolling } from "./useDiagramPolling"
import { useHttpPresence } from "./useHttpPresence"

const TIMEOUT_MS = 7500
const HEARTBEAT_MS = 3000

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
  const cursorRef = useRef({ x: 0, y: 0 })
  const lastBroadcastRef = useRef(0)

  const syncState = useCallback(() => {
    setCollaborators(Array.from(collaboratorsMap.current.values()))
  }, [])

  const upsert = useCallback((p: CollaboratorPresence) => {
    if (String(p.id) === clientId) return
    const prev = collaboratorsMap.current.get(p.id)
    collaboratorsMap.current.set(p.id, {
      id: p.id,
      username: p.username || prev?.username || "Colaborador",
      color: p.color || prev?.color || "#2563eb",
      cursor: p.cursor || prev?.cursor || { x: 0, y: 0 },
      selectedEntityId: p.selectedEntityId ?? prev?.selectedEntityId ?? null,
      lastActive: Date.now(),
    })
    syncState()
  }, [clientId, syncState])

  const handleHttpSync = useCallback((remote: CollaboratorPresence[]) => {
    remote.forEach(upsert)
  }, [upsert])

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
      upsert({
        id: msg.senderId,
        username: msg.username,
        color: msg.color || "#2563eb",
        cursor: msg.cursor || { x: 0, y: 0 },
        selectedEntityId: msg.selectedEntityId ?? null,
        lastActive: Date.now(),
      })
    }

    channel.addEventListener("message", onMessage)
    const hb = setInterval(sendPing, HEARTBEAT_MS)
    const prune = setInterval(() => {
      const cutoff = Date.now() - TIMEOUT_MS
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
      clearInterval(hb)
      clearInterval(prune)
      channel.removeEventListener("message", onMessage)
      try {
        channel.postMessage({ type: "USER_LEAVE", senderId: clientId, timestamp: Date.now() })
        channel.close()
      } catch {}
      channelRef.current = null
    }
  }, [proyectoId, clientId, username, color, upsert, syncState])

  return {
    collaborators,
    broadcastCursor,
    myPresence: { id: clientId, username, color },
  }
}
