package com.casetool.backend.modules.diagrama.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EntidadDiagramaRequest(
    @NotBlank(message = "El nombre de la entidad es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    String nombre,

    @NotNull(message = "La posición X es obligatoria")
    Double posX,

    @NotNull(message = "La posición Y es obligatoria")
    Double posY
) {
}
