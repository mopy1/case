export interface CollaboratorCursor {
  x: number
  y: number
}

export interface CollaboratorPresence {
  id: number | string
  username: string
  color: string
  cursor: CollaboratorCursor
  selectedEntityId: number | null
  lastActive: number
}

export type CollaborationEventType =
  | "CURSOR_MOVE"
  | "USER_JOIN"
  | "USER_LEAVE"
  | "DIAGRAM_MUTATION"
  | "NODE_SELECT"

export interface CollaborationMessage {
  type: CollaborationEventType
  senderId: number | string
  username: string
  color?: string
  cursor?: CollaboratorCursor
  selectedEntityId?: number | null
  timestamp: number
  payload?: unknown
}
