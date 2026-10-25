package com.casetool.backend.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMensajeRequest(
    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 4000, message = "El mensaje no puede superar 4000 caracteres")
    String contenido
) {
}
