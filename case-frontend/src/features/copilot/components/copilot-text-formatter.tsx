export function renderFormattedContent(text: string) {
  const lines = text.split("\n")
  return (
    <div className="flex flex-col gap-1.5 leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed || /^`+$/.test(trimmed)) return null

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-semibold text-foreground tracking-tight break-words">
              {trimmed.replace("### ", "")}
            </h4>
          )
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")
        const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed
        if (!content.trim() || /^`+$/.test(content.trim())) return null

        const formatted = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            const inner = part.slice(1, -1).trim()
            if (!inner || inner === "`") return null
            return (
              <code key={pIdx} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-primary break-all">
                {inner}
              </code>
            )
          }
          return part
        })

        const hasContent = formatted.some((p) => {
          if (!p) return false
          if (typeof p === "string") return p.trim().length > 0
          return true
        })
        if (!hasContent) return null

        return (
          <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
            {isBullet && <span className="text-primary font-bold">•</span>}
            <span className="flex-1 min-w-0 break-words">{formatted}</span>
          </div>
        )
      })}
    </div>
  )
}
