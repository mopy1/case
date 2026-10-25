export { ChatTeamView } from "./components/chat-team-view"
export { ChatCodeBlock } from "./components/chat-code-block"
export { ChatMarkdownRenderer } from "./components/chat-markdown-renderer"
export { ChatMessageContent } from "./components/chat-message-content"
export { ChatVoiceButton } from "./components/chat-voice-button"
export { ChatMentionPopover } from "./components/chat-mention-popover"
export { ChatMentionItem } from "./components/chat-mention-item"
export { ChatProposalCard } from "./components/chat-proposal-card"
export { ChatProposalSummary } from "./components/chat-proposal-summary"
export { ChatProposalActionButton } from "./components/chat-proposal-action-button"
export { useMentionTrigger } from "./hooks/useMentionTrigger"
export { useChatVoiceInput } from "./hooks/useChatVoiceInput"
export { useChatProposalExecutor } from "./hooks/useChatProposalExecutor"
export { parseChatProposal } from "./lib/chatProposalParser"
export { isProposalApplied, markProposalApplied, getAppliedProposals } from "./lib/chatProposalStorage"
export type {
  ChatIaEstadoEvent,
  ChatMensaje,
  ChatPresencia,
  EstadoConexionChat,
  EstadoIaChat,
  TipoMensajeChat,
  UsuarioEnSala,
} from "./types/chat.types"
export type { MentionItem, MentionTriggerState } from "./types/mention.types"
export type { MarkdownBlock, MarkdownBlockType } from "./types/markdown.types"
export type {
  ChatProposal,
  ChatProposalSummary as ChatProposalSummaryData,
  EstadoPropuesta,
  PermisosPropuesta,
} from "./types/chat-proposal.types"
export { evaluarPermisosPropuesta } from "./types/chat-proposal.types"
