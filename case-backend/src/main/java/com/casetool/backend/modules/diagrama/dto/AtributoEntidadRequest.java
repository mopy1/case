package com.casetool.backend.modules.diagrama.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtributoEntidadRequest(
    @NotBlank(message = "El nombre del atributo es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    String nombre,

    @NotBlank(message = "El tipo SQL es obligatorio")
    @Size(max = 50, message = "El tipo SQL no puede superar los 50 caracteres")
    String tipoSql,

    @NotNull(message = "Hay que indicar si es clave primaria")
    Boolean esPk,

    @NotNull(message = "Hay que indicar si es clave foránea")
    Boolean esFk,

    Long referenciaEntidadId,

    @NotNull(message = "Hay que indicar si el atributo admite nulos")
    Boolean nullable
) {
}
