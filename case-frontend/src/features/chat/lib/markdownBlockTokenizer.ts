import type { MarkdownBlock } from "../types/markdown.types"

const isBlockBoundary = (l: string) =>
  l.trim() === "" || l.startsWith("```") || l.startsWith(">") || /^#{1,6}\s+/.test(l) || /^\s*[-*•+]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)

/**
 * Tokeniza texto Markdown en bloques estructurados (código, encabezados, citas, listas, párrafos).
 */
export function tokenizeMarkdownBlocks(rawText: string): MarkdownBlock[] {
  if (!rawText) return []
  const blocks: MarkdownBlock[] = []
  const lines = rawText.replace(/\r\n/g, "\n").split("\n")
  let i = 0
  let id = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === "" || /^`+$/.test(line.trim())) {
      i++
      continue
    }

    const codeMatch = line.match(/^```(\w+)?/)
    if (codeMatch) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) codeLines.push(lines[i++])
      if (i < lines.length && lines[i].startsWith("```")) i++
      const codeContent = codeLines.join("\n")
      if (codeContent.trim() !== "") {
        blocks.push({
          id: `code-${id++}`,
          type: "code_block",
          content: codeContent,
          meta: { language: codeMatch[1]?.toLowerCase() || "" },
        })
      }
      continue
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (hMatch) {
      blocks.push({
        id: `h-${id++}`,
        type: "heading",
        content: hMatch[2].trim(),
        meta: { level: hMatch[1].length },
      })
      i++
      continue
    }

    if (line.startsWith(">")) {
      const qLines: string[] = []
      while (i < lines.length && lines[i].startsWith(">")) qLines.push(lines[i++].replace(/^>\s?/, ""))
      blocks.push({ id: `q-${id++}`, type: "blockquote", content: qLines.join("\n") })
      continue
    }

    if (/^\s*[-*•+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*•+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*•+]\s+/, ""))
      blocks.push({ id: `ul-${id++}`, type: "bullet_list", content: items.join("\n"), meta: { items } })
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""))
      blocks.push({ id: `ol-${id++}`, type: "ordered_list", content: items.join("\n"), meta: { items } })
      continue
    }

    const pLines: string[] = [lines[i++]]
    while (i < lines.length && !isBlockBoundary(lines[i])) pLines.push(lines[i++])
    blocks.push({ id: `p-${id++}`, type: "paragraph", content: pLines.join("\n") })
  }

  return blocks
}
