package com.casetool.backend.modules.proyecto.dto;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import jakarta.validation.constraints.NotNull;

public record CambiarRolMiembroRequest(
    @NotNull(message = "El rol es obligatorio")
    MiembroProyecto.Rol rol
) {
}
