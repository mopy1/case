package com.casetool.backend.modules.chat.ia.dto;

import java.util.List;

public record DeepSeekChatRequest(
    String model,
    List<Mensaje> messages,
    Double temperature,
    Integer max_tokens
) {
    public record Mensaje(String role, String content) {}
}
