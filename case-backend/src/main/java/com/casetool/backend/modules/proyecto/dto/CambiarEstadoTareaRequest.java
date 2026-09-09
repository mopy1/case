package com.casetool.backend.modules.proyecto.dto;

import com.casetool.backend.modules.proyecto.model.TareaProyecto;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoTareaRequest(
    @NotNull(message = "El nuevo estado es obligatorio")
    TareaProyecto.Estado estado
) {
}
