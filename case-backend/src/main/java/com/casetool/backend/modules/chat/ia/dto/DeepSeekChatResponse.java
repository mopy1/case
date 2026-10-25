package com.casetool.backend.modules.chat.ia.dto;

import java.util.List;

public record DeepSeekChatResponse(
    String id,
    List<Choice> choices,
    Usage usage
) {
    public record Choice(int index, Mensaje message, String finish_reason) {}

    public record Mensaje(String role, String content) {}

    public record Usage(int prompt_tokens, int completion_tokens, int total_tokens) {}

    public String contenido() {
        if (choices == null || choices.isEmpty() || choices.get(0).message() == null) {
            return "";
        }
        String content = choices.get(0).message().content();
        return content != null ? content.trim() : "";
    }
}
