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
  // 1. Formato exacto ADR_SUGERIDA: [...] MOTIVO: [...]
  const adrMatch = text.match(/ADR_SUGERIDA:\s*\[([^\]]+)\]\s*MOTIVO:\s*\[([^\]]+)\]/i)
  if (adrMatch) {
    return { accion: adrMatch[1].trim(), motivo: adrMatch[2].trim() }
  }

  // 2. Formato sin corchetes o con negritas: ADR_SUGERIDA: ... MOTIVO: ...
  const matchLoose = text.match(
    /(?:\*{0,2})ADR_SUGERIDA:?(?:\*{0,2})\s*\[?([^\n\]]+)\]?\s*\n+\s*(?:\*{0,2})MOTIVO:?(?:\*{0,2})\s*\[?([^\n\]]+)\]?/i
  )
  if (matchLoose) {
    return {
      accion: matchLoose[1].trim().replace(/^\[|\]$/g, ""),
      motivo: matchLoose[2].trim().replace(/^\[|\]$/g, ""),
    }
  }

  // 3. Formato natural: Acción:** ... Motivo:** ... o Acción: ... Motivo: ...
  const matchNatural = text.match(
    /(?:\*{0,2})Acci[oó]n:?(?:\*{0,2})\s*\n?\s*\[?([^\n\]]+)\]?\s*\n+(?:[•\-\*\s]*)(?:\*{0,2})Motivo(?: T[eé]cnico)?:?(?:\*{0,2})\s*\n?\s*\[?([^\n\]]+)\]?/i
  )
  if (matchNatural) {
    return {
      accion: matchNatural[1].trim().replace(/^\[|\]$/g, ""),
      motivo: matchNatural[2].trim().replace(/^\[|\]$/g, ""),
    }
  }

  return undefined
}

function cleanResponseText(rawText: string): string {
  return rawText
    .replace(/(?:##\s*ADR:?[\s\S]*$)/i, "")
    .replace(/(?:\*{0,2})ADR_SUGERIDA:?[\s\S]*$/i, "")
    .replace(/(?:\*{0,2})Acci[oó]n:?(?:\*{0,2})[\s\S]*$/i, "")
    .replace(/##\s*⚠️\s*Aclaración importante[\s\S]*$/i, "")
    .trim()
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

REGLAS ESTRICTAS DE RESPUESTA:
1. BREVEDAD EXTREMA: Responde de forma muy corta, directa y profesional. Máximo 1 a 2 oraciones (menos de 40 palabras). PROHIBIDO dar discursos largos, sermones, advertencias o tutoriales paso a paso no solicitados.
2. NUNCA DIGAS QUE NO PUEDES GUARDAR O ESCRIBIR EN EL PROYECTO: El sistema tiene integración directa a la base de datos PostgreSQL. Tu trabajo es formular la nota y el sistema mostrará el botón interactivo para guardarla.
3. SI EL USUARIO PIDE CREAR O GUARDAR UNA NOTA (o sugieres una decisión arquitectónica):
Responde con una sola frase confirmando la nota y añade SIEMPRE este bloque exacto al final:
ADR_SUGERIDA: [Título claro de la acción]
MOTIVO: [Justificación técnica concisa de una línea]`

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
          const cleanedText = cleanResponseText(rawText)
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
          const cleanedText = cleanResponseText(rawText)
          return { text: cleanedText || rawText, adrSuggestion }
        }
      }
    } catch {
      // Fallback
    }
  }

  return generateLocalResponse(query, section)
}
