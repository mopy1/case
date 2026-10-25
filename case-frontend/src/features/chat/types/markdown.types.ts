export type MarkdownBlockType =
  | "heading"
  | "code_block"
  | "blockquote"
  | "bullet_list"
  | "ordered_list"
  | "paragraph"

export interface MarkdownBlock {
  id: string
  type: MarkdownBlockType
  content: string
  meta?: {
    level?: number
    language?: string
    items?: string[]
  }
}
