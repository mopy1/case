import type { CopilotMessage } from "../types/copilot.types"

export function updateEntityCreatedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.entitySuggestions
      ? {
          ...msg,
          entitySuggestions: msg.entitySuggestions.map((e, i) =>
            i === index ? { ...e, creada: true } : e
          ),
        }
      : msg
  )
}

export function updateRelationCreatedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.relationSuggestions
      ? {
          ...msg,
          relationSuggestions: msg.relationSuggestions.map((r, i) =>
            i === index ? { ...r, creada: true } : r
          ),
        }
      : msg
  )
}

export function updateRelationDeletedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.relationDeleteSuggestions
      ? {
          ...msg,
          relationDeleteSuggestions: msg.relationDeleteSuggestions.map((r, i) =>
            i === index ? { ...r, eliminada: true } : r
          ),
        }
      : msg
  )
}

export function updateAttributeCreatedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.attributeSuggestions
      ? {
          ...msg,
          attributeSuggestions: msg.attributeSuggestions.map((a, i) =>
            i === index ? { ...a, creada: true } : a
          ),
        }
      : msg
  )
}

export function updateEntityDeletedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.entityDeleteSuggestions
      ? {
          ...msg,
          entityDeleteSuggestions: msg.entityDeleteSuggestions.map((d, i) =>
            i === index ? { ...d, eliminada: true } : d
          ),
        }
      : msg
  )
}

export function updateTaskCreatedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.taskSuggestions
      ? {
          ...msg,
          taskSuggestions: msg.taskSuggestions.map((t, i) =>
            i === index ? { ...t, creada: true } : t
          ),
        }
      : msg
  )
}

export function updateSystemActionExecutedInMessages(
  messages: CopilotMessage[],
  messageId: string,
  index: number
): CopilotMessage[] {
  return messages.map((msg) =>
    msg.id === messageId && msg.systemActions
      ? {
          ...msg,
          systemActions: msg.systemActions.map((s, i) =>
            i === index ? { ...s, ejecutada: true } : s
          ),
        }
      : msg
  )
}

export function markAllAppliedInMessage(
  messages: CopilotMessage[],
  messageId: string
): CopilotMessage[] {
  return messages.map((msg) => {
    if (msg.id !== messageId) return msg
    return {
      ...msg,
      adrSuggestion: msg.adrSuggestion ? { ...msg.adrSuggestion, guardada: true } : undefined,
      adrSuggestions: msg.adrSuggestions?.map((a) => ({ ...a, guardada: true })),
      entitySuggestions: msg.entitySuggestions?.map((e) => ({ ...e, creada: true })),
      relationSuggestions: msg.relationSuggestions?.map((r) => ({ ...r, creada: true })),
      relationDeleteSuggestions: msg.relationDeleteSuggestions?.map((r) => ({ ...r, eliminada: true })),
      attributeSuggestions: msg.attributeSuggestions?.map((a) => ({ ...a, creada: true })),
      entityDeleteSuggestions: msg.entityDeleteSuggestions?.map((d) => ({ ...d, eliminada: true })),
      taskSuggestions: msg.taskSuggestions?.map((t) => ({ ...t, creada: true })),
      systemActions: msg.systemActions?.map((s) => ({ ...s, ejecutada: true })),
    }
  })
}
