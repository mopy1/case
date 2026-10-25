import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatCodeBlockProps {
  codigo: string
  lenguaje?: string
}

/**
 * Bloque de código estilizado con etiqueta de lenguaje y botón "Copiar" con feedback de 2s.
 */
export function ChatCodeBlock({ codigo, lenguaje }: ChatCodeBlockProps) {
  const [copiado, setCopiado] = useState(false)

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Si el navegador bloquea el clipboard, fallback silencioso
    }
  }

  const langLabel = lenguaje ? lenguaje.toUpperCase() : "CODE"

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border/70 bg-muted/40 text-foreground">
      <div className="flex h-8 items-center justify-between border-b border-border/60 bg-muted/70 px-3">
        <span className="font-mono text-[10px] font-semibold tracking-wider text-muted-foreground">
          {langLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleCopiar}
          className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
          aria-label={copiado ? "Código copiado" : "Copiar código"}
        >
          {copiado ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copiar</span>
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-foreground/90 selection:bg-primary/20">
        <code>{codigo}</code>
      </pre>
    </div>
  )
}
