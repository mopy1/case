package com.casetool.backend.core.ia.dto;

import java.util.List;

public record DeepSeekChatResponse(
    String id,
    List<Choice> choices,
    Usage usage
) {
    public record Choice(int index, DeepSeekMensaje message, String finish_reason) {}

    public record Usage(int prompt_tokens, int completion_tokens, int total_tokens) {}

    /** Mensaje del primer choice, o null si la respuesta vino vacía. */
    public DeepSeekMensaje mensaje() {
        if (choices == null || choices.isEmpty()) {
            return null;
        }
        return choices.get(0).message();
    }

    public String contenido() {
        DeepSeekMensaje m = mensaje();
        return m != null && m.content() != null ? m.content().trim() : "";
    }
}
