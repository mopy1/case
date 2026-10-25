import type { MarkdownBlock } from "../types/markdown.types"
import { renderMarkdownInline } from "../lib/markdownInline"
import { ChatCodeBlock } from "./chat-code-block"

interface ChatMarkdownRendererProps {
  blocks: MarkdownBlock[]
}

/**
 * Renderiza el AST de bloques Markdown en nodos React limpios y estilizados.
 */
export function ChatMarkdownRenderer({ blocks }: ChatMarkdownRendererProps) {
  if (blocks.length === 0) return null

  return (
    <div className="space-y-1.5 text-xs text-foreground/90">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading": {
            const isTopLevel = (block.meta?.level ?? 1) <= 2
            return (
              <div
                key={block.id}
                className={
                  isTopLevel
                    ? "pt-1 font-semibold text-sm tracking-tight text-foreground"
                    : "pt-0.5 font-semibold text-xs text-foreground"
                }
              >
                {renderMarkdownInline(block.content)}
              </div>
            )
          }

          case "blockquote":
            return (
              <blockquote
                key={block.id}
                className="my-1 rounded-r border-l-2 border-primary/40 bg-muted/30 py-1 pl-2.5 italic text-muted-foreground"
              >
                {renderMarkdownInline(block.content)}
              </blockquote>
            )

          case "bullet_list":
            return (
              <ul key={block.id} className="my-1 space-y-1 pl-1">
                {(block.meta?.items ?? block.content.split("\n")).map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-1.5 text-primary select-none">•</span>
                    <span className="flex-1 leading-relaxed">{renderMarkdownInline(item)}</span>
                  </li>
                ))}
              </ul>
            )

          case "ordered_list":
            return (
              <ol key={block.id} className="my-1 space-y-1 pl-1">
                {(block.meta?.items ?? block.content.split("\n")).map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-1.5 font-mono text-[10px] text-muted-foreground select-none">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 leading-relaxed">{renderMarkdownInline(item)}</span>
                  </li>
                ))}
              </ol>
            )

          case "code_block":
            return (
              <ChatCodeBlock
                key={block.id}
                codigo={block.content}
                lenguaje={block.meta?.language}
              />
            )

          case "paragraph":
          default:
            return (
              <p key={block.id} className="my-0.5 leading-relaxed break-words whitespace-pre-wrap">
                {renderMarkdownInline(block.content)}
              </p>
            )
        }
      })}
    </div>
  )
}
