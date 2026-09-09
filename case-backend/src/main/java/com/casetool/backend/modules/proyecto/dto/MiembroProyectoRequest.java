package com.casetool.backend.modules.proyecto.dto;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MiembroProyectoRequest(
    @NotBlank(message = "El username o email del usuario es obligatorio")
    String usernameOrEmail,

    @NotNull(message = "El rol es obligatorio")
    MiembroProyecto.Rol rol
) {
}
