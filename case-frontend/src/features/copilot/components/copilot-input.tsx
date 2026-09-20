import { useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CopilotSection } from "../types/copilot.types"

interface CopilotInputProps {
  section: CopilotSection
  loading: boolean
  onSend: (text: string) => void
}

const SECTION_PLACEHOLDERS: Record<CopilotSection, string> = {
  diagrama: "Pregunta sobre tablas, tipos SQL o relaciones...",
  generador: "Pregunta sobre Spring Boot 3.4, dependencias...",
  xmi: "Pregunta sobre importar o exportar XMI a EA...",
  notas: "Pregunta sobre justificación o notas ADR...",
  tareas: "Pregunta sobre organización de tareas...",
  general: "Escribe tu consulta sobre la herramienta CASE...",
}

export function CopilotInput({ section, loading, onSend }: CopilotInputProps) {
  const [text, setText] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return
    onSend(text)
    setText("")
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-3">
      <div className="relative flex items-center">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SECTION_PLACEHOLDERS[section] || "Escribe tu consulta..."}
          disabled={loading}
          className="pr-10 text-xs shadow-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || loading}
          className="absolute right-1 size-7 rounded-md"
        >
          <ArrowUp className="size-3.5" />
        </Button>
      </div>
    </form>
  )
}
