import type { AdrSuggestion, CopilotSection } from "../types/copilot.types"
import { generateLocalResponse, KNOWLEDGE_TOPICS } from "./copilotKnowledge"

interface GeminiResponsePayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function parseAdrFromText(text: string): AdrSuggestion | undefined {
  const adrMatch = text.match(/ADR_SUGERIDA:\s*\[([^\]]+)\]\s*MOTIVO:\s*\[([^\]]+)\]/i)
  if (adrMatch) {
    return { accion: adrMatch[1].trim(), motivo: adrMatch[2].trim() }
  }
  return undefined
}

export async function askCopilot(
  query: string,
  section: CopilotSection
): Promise<{ text: string; adrSuggestion?: AdrSuggestion }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return generateLocalResponse(query, section)
  }

  const systemContext = `Eres el Asistente Experto (Copilot y Manual de Usuario) de la herramienta Collaborative CASE Tool.
La vista actual del usuario es: "${section}".
Base de Conocimiento del Sistema:
${KNOWLEDGE_TOPICS.map((t) => `- ${t.title} (${t.section}): ${t.summary}\n${t.content}`).join("\n\n")}

Instrucciones:
1. Responde de forma clara, profesional y didáctica en español.
2. Si sugieres una decisión arquitectónica o el usuario pregunta por arquitectura/ADR, incluye al final este formato exacto:
ADR_SUGERIDA: [Descripción breve de la acción técnica]
MOTIVO: [Justificación técnica fundamentada]
3. Resalta palabras clave y opciones del menú en negrita.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: query }] }],
          systemInstruction: { parts: [{ text: systemContext }] },
        }),
      }
    )

    if (!res.ok) {
      return generateLocalResponse(query, section)
    }

    const data: GeminiResponsePayload = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return generateLocalResponse(query, section)
    }

    const adrSuggestion = parseAdrFromText(rawText)
    const cleanedText = rawText.replace(/ADR_SUGERIDA:[\s\S]*$/, "").trim()

    return {
      text: cleanedText || rawText,
      adrSuggestion,
    }
  } catch {
    return generateLocalResponse(query, section)
  }
}
