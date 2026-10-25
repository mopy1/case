export { ChatTeamView } from "./components/chat-team-view"
export { parseChatProposal } from "./lib/chatProposalParser"
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
export type { ChatProposal, EstadoPropuesta, PermisosPropuesta } from "./types/chat-proposal.types"
export { evaluarPermisosPropuesta } from "./types/chat-proposal.types"
