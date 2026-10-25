import { cn } from "@/lib/utils"
import { CodeBlock } from "./code-block"
import { renderMarkdownInline } from "./markdown-inline"
import type { MarkdownBlock } from "./markdown.types"

interface MarkdownRendererProps {
  blocks: MarkdownBlock[]
  currentUsername?: string
}

function ListItems({ block, ordered, user }: { block: MarkdownBlock; ordered: boolean; user?: string }) {
  const items = block.meta?.items ?? block.content.split("\n")
  return items.map((item, idx) => (
    <li key={idx} className="flex items-start gap-2">
      <span className={cn("shrink-0 text-muted-foreground select-none", ordered && "tabular-nums")}>
        {ordered ? `${idx + 1}.` : "•"}
      </span>
      <span className="min-w-0 flex-1">{renderMarkdownInline(item, user)}</span>
    </li>
  ))
}

/** Renderiza el AST de bloques Markdown (cuerpo a 14 px, interlineado 24 px). */
export function MarkdownRenderer({ blocks, currentUsername: user }: MarkdownRendererProps) {
  if (blocks.length === 0) return null

  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm leading-6 text-foreground">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading": {
            const top = (block.meta?.level ?? 1) <= 2
            return (
              <p key={block.id} className={cn("font-semibold", top ? "text-base" : "text-sm")}>
                {renderMarkdownInline(block.content, user)}
              </p>
            )
          }
          case "blockquote":
            return (
              <blockquote key={block.id} className="border-l-2 border-border pl-3 text-muted-foreground">
                {renderMarkdownInline(block.content, user)}
              </blockquote>
            )
          case "bullet_list":
            return (
              <ul key={block.id} className="flex flex-col gap-1">
                <ListItems block={block} ordered={false} user={user} />
              </ul>
            )
          case "ordered_list":
            return (
              <ol key={block.id} className="flex flex-col gap-1">
                <ListItems block={block} ordered user={user} />
              </ol>
            )
          case "code_block":
            return <CodeBlock key={block.id} codigo={block.content} lenguaje={block.meta?.language} />
          default:
            return (
              <p key={block.id} className="wrap-break-word whitespace-pre-wrap">
                {renderMarkdownInline(block.content, user)}
              </p>
            )
        }
      })}
    </div>
  )
}
