import { useMemo } from "react"
import { tokenizeMarkdownBlocks } from "../lib/markdownBlockTokenizer"
import { ChatMarkdownRenderer } from "./chat-markdown-renderer"

interface ChatMessageContentProps {
  contenido: string
}

/**
 * Conecta el contenido en bruto del mensaje con el tokenizador y renderizador Markdown.
 */
export function ChatMessageContent({ contenido }: ChatMessageContentProps) {
  const blocks = useMemo(() => tokenizeMarkdownBlocks(contenido), [contenido])

  return <ChatMarkdownRenderer blocks={blocks} />
}
