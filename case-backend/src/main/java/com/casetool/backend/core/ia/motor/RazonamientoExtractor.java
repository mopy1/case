package com.casetool.backend.core.ia.motor;

import com.casetool.backend.core.ia.dto.DeepSeekMensaje;

/**
 * Qwen piensa en voz alta: separa el bloque {@code <think>…</think>} del texto final para que el chat
 * muestre la respuesta limpia (con los comandos del final intactos) y el razonamiento aparte.
 */
public final class RazonamientoExtractor {

    private static final String ABRE = "<think>";
    private static final String CIERRA = "</think>";

    private RazonamientoExtractor() {
    }

    /** Si viene {@code reasoning_content} se usa ese; si no, se extrae del {@code content}. */
    public static DeepSeekMensaje normalizar(DeepSeekMensaje m) {
        if (m == null) return null;
        String[] partes = separar(m.content() != null ? m.content() : "");
        String razonamiento = noVacio(m.reasoning_content()) ? m.reasoning_content().strip() : partes[0];
        return new DeepSeekMensaje(m.role(), partes[1], m.tool_calls(), m.tool_call_id(),
                noVacio(razonamiento) ? razonamiento : null);
    }

    /** [razonamiento, contenido]. Cubre "<think>…</think>x", "…</think>x" (el template abrió el tag) y "<think>…" sin cerrar. */
    static String[] separar(String content) {
        String texto = content.strip();
        int cierre = texto.indexOf(CIERRA);
        if (cierre >= 0) {
            String antes = texto.substring(0, cierre);
            antes = antes.startsWith(ABRE) ? antes.substring(ABRE.length()) : antes;
            return new String[] { antes.strip(), texto.substring(cierre + CIERRA.length()).strip() };
        }
        if (texto.startsWith(ABRE)) {
            return new String[] { texto.substring(ABRE.length()).strip(), "" };
        }
        return new String[] { "", texto };
    }

    private static boolean noVacio(String s) {
        return s != null && !s.isBlank();
    }
}
