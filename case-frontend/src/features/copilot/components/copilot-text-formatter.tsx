export function renderFormattedContent(text: string) {
  const lines = text.split("\n")
  return (
    <div className="flex flex-col gap-1.5 leading-relaxed break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-1" />

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-semibold text-foreground tracking-tight break-words">
              {trimmed.replace("### ", "")}
            </h4>
          )
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")
        const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed

        const formatted = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-primary break-all">
                {part.slice(1, -1)}
              </code>
            )
          }
          return part
        })

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
