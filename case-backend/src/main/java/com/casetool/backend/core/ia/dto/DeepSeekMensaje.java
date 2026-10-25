package com.casetool.backend.core.ia.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Un mensaje de la conversación con DeepSeek (formato OpenAI). Sirve para pedir y para leer la respuesta:
 * {@code tool_calls} solo lo trae el assistant cuando pide herramientas y {@code tool_call_id} solo
 * lo lleva el mensaje {@code tool} con el resultado. NON_NULL evita mandar esos campos en null.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeepSeekMensaje(
    String role,
    String content,
    List<DeepSeekToolCall> tool_calls,
    String tool_call_id
) {
    public static DeepSeekMensaje system(String content) {
        return new DeepSeekMensaje("system", content, null, null);
    }

    public static DeepSeekMensaje user(String content) {
        return new DeepSeekMensaje("user", content, null, null);
    }

    /** Eco del assistant que pidió herramientas: la API exige reenviarlo antes de los resultados. */
    public static DeepSeekMensaje asistente(String content, List<DeepSeekToolCall> toolCalls) {
        return new DeepSeekMensaje("assistant", content != null ? content : "", toolCalls, null);
    }

    public static DeepSeekMensaje tool(String toolCallId, String resultado) {
        return new DeepSeekMensaje("tool", resultado, null, toolCallId);
    }

    public boolean tieneToolCalls() {
        return tool_calls != null && !tool_calls.isEmpty();
    }
}
