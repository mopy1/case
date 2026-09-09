package com.casetool.backend.modules.proyecto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotaProyectoRequest(
    @NotBlank(message = "La acción es obligatoria")
    @Size(max = 100, message = "La acción no puede superar 100 caracteres")
    String accion,

    @NotBlank(message = "El motivo es obligatorio — es el 'por qué' de la nota")
    String motivo
) {
}
