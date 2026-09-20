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
      attributeSuggestions: msg.attributeSuggestions?.map((a) => ({ ...a, creada: true })),
      entityDeleteSuggestions: msg.entityDeleteSuggestions?.map((d) => ({ ...d, eliminada: true })),
    }
  })
}
