package com.casetool.backend.modules.chat.ia.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Body de POST /chat/completions; sin herramientas, {@code tools} y {@code tool_choice} no se envían. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeepSeekChatRequest(
    String model,
    List<DeepSeekMensaje> messages,
    Double temperature,
    Integer max_tokens,
    List<DeepSeekTool> tools,
    String tool_choice
) {
}
