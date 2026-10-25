package com.casetool.backend.modules.copilot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Un turno previo de la conversación con la Guía (el historial vive en memoria del navegador). */
public record CopilotTurno(
    @NotNull @Pattern(regexp = "usuario|asistente", message = "Rol de turno inválido") String rol,
    @NotBlank @Size(max = 1500, message = "Cada turno puede tener hasta 1500 caracteres") String texto
) {
}
