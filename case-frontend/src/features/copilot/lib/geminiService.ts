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
  const deepseekKey =
    import.meta.env.VITE_DEEPSEEK_API_KEY ||
    (import.meta.env as unknown as Record<string, string>)["VITE_DEEPSEEk_API_KEY"]
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY

  // Si no hay ninguna clave, responde el motor local con la base de conocimiento embebida (100% offline)
  if (!deepseekKey && !geminiKey) {
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

  // 1. Si está configurada la clave de DeepSeek, usar DeepSeek-V3 (ultraeconómico)
  if (deepseekKey && typeof deepseekKey === "string" && deepseekKey.trim()) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey.trim()}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemContext },
            { role: "user", content: query },
          ],
          temperature: 0.6,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const rawText = data.choices?.[0]?.message?.content
        if (rawText) {
          const adrSuggestion = parseAdrFromText(rawText)
          const cleanedText = rawText.replace(/ADR_SUGERIDA:[\s\S]*$/, "").trim()
          return { text: cleanedText || rawText, adrSuggestion }
        }
      }
    } catch {
      // Fallback si falla la llamada
    }
  }

  // 2. Si está configurada la clave de Gemini
  if (geminiKey && typeof geminiKey === "string" && geminiKey.trim()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: systemContext }] },
          }),
        }
      )

      if (res.ok) {
        const data: GeminiResponsePayload = await res.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          const adrSuggestion = parseAdrFromText(rawText)
          const cleanedText = rawText.replace(/ADR_SUGERIDA:[\s\S]*$/, "").trim()
          return { text: cleanedText || rawText, adrSuggestion }
        }
      }
    } catch {
      // Fallback
    }
  }

  return generateLocalResponse(query, section)
}
