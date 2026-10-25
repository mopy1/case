import { useMemo } from "react"
import { normalizeMarkdownSpacing } from "../lib/chatMarkdownNormalizer"
import { tokenizeMarkdownBlocks } from "../lib/markdownBlockTokenizer"
import { ChatMarkdownRenderer } from "./chat-markdown-renderer"

export interface ChatMessageContentProps {
  contenido?: string
  text?: string
  currentUsername?: string
}

/**
 * Conecta el contenido en bruto del mensaje con el normalizador, tokenizador y renderizador Markdown.
 */
export function ChatMessageContent({ contenido, text, currentUsername }: ChatMessageContentProps) {
  const raw = contenido ?? text ?? ""
  const normalizado = useMemo(() => normalizeMarkdownSpacing(raw), [raw])
  const blocks = useMemo(() => tokenizeMarkdownBlocks(normalizado), [normalizado])

  return <ChatMarkdownRenderer blocks={blocks} currentUsername={currentUsername} />
}
