import type { EntidadDiagramaResponse, RelacionDiagramaResponse } from "@/features/diagram/types/diagram.types"
import type { ProcessedImage } from "./copilotImageUtils"

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.0-flash",
]

function buildVisionPrompt(
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] }
): string {
  const existingNames = diagram?.entidades.map((e) => e.nombre).join(", ") || "Ninguna"

  return `Eres el módulo de visión arquitectónica de Collaborative CASE Tool.
Tu función es analizar fotos o capturas de diagramas UML / Entidad-Relación (bocetos en papel o pizarra, o diagramas digitales).

Tablas existentes en el proyecto: ${existingNames}.
Tipos SQL válidos: BIGINT, VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, DECIMAL.

Reglas obligatorias:
1. Explica brevemente qué entidades y relaciones identificaste en la imagen.
2. Para cada entidad detectada que deba crearse, incluye:
CREAR_TABLA: [NombreEntidad] (x: 100, y: 100)
ATRIBUTOS: [id:BIGINT:PK, nombre:VARCHAR, ...]
(Incrementa x e y para no superponerlas, ej: x: 100, x: 450, x: 800).
3. Para cada relación identificada entre tablas:
CREAR_RELACION: [TablaOrigen] -> [TablaDestino] (1 a N)
(Valores válidos: 1 a 1, 1 a N, N a M).
4. Sugiere al menos una decisión arquitectónica justificada:
ADR_SUGERIDA: [Acción sugerida] MOTIVO: [Justificación técnica]`
}

export async function askGeminiVision(
  query: string,
  image: ProcessedImage,
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] }
): Promise<string> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!geminiKey || typeof geminiKey !== "string" || !geminiKey.trim()) {
    throw new Error("No hay API Key configurada para Google Gemini (VITE_GEMINI_API_KEY).")
  }

  const systemInstruction = buildVisionPrompt(diagram)
  const userText = query.trim() || "Analiza esta imagen y extrae el diagrama UML con sus tablas, atributos y relaciones."

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: userText },
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: image.base64Data,
                  },
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
        }),
      })

      if (!res.ok) {
        continue
      }

      const data = await res.json()
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (answer && answer.trim()) {
        return answer
      }
    } catch {
      // Intentar con el siguiente modelo de Gemini
    }
  }

  throw new Error("No se pudo procesar la imagen con los modelos de Google Gemini. Verifica tu conexión o cuota.")
}
