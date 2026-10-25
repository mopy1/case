import { useMemo } from "react"
import { MarkdownRenderer } from "./markdown-renderer"
import { normalizeMarkdownSpacing } from "./normalizer"
import { tokenizeMarkdownBlocks } from "./tokenizer"

export interface MessageMarkdownProps {
  text: string
  /** Para resaltar la mención propia (`@yo`). */
  currentUsername?: string
}

/** Texto en bruto → normalizador → AST de bloques → render. Lo usan los dos chats. */
export function MessageMarkdown({ text, currentUsername }: MessageMarkdownProps) {
  const blocks = useMemo(() => tokenizeMarkdownBlocks(normalizeMarkdownSpacing(text)), [text])
  return <MarkdownRenderer blocks={blocks} currentUsername={currentUsername} />
}
