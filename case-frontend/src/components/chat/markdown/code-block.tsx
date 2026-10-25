import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CodeBlockProps {
  codigo: string
  lenguaje?: string
}

/** Bloque de código con el lenguaje y un botón "Copiar" (feedback de 2 s). */
export function CodeBlock({ codigo, lenguaje }: CodeBlockProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // El navegador bloqueó el portapapeles: no hay nada más que hacer.
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/40">
      <div className="flex h-8 items-center justify-between border-b border-border pr-1 pl-3">
        <span className="font-mono text-xs text-muted-foreground">{(lenguaje ?? "código").toLowerCase()}</span>
        <Button type="button" variant="ghost" size="xs" onClick={copiar} aria-label={copiado ? "Código copiado" : "Copiar código"}>
          {copiado ? <Check data-icon="inline-start" className="text-success" /> : <Copy data-icon="inline-start" />}
          <span className={copiado ? "text-success" : undefined}>{copiado ? "Copiado" : "Copiar"}</span>
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-5">
        <code>{codigo}</code>
      </pre>
    </div>
  )
}
