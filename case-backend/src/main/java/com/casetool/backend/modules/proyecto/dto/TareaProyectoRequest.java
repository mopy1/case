package com.casetool.backend.modules.proyecto.dto;

import com.casetool.backend.modules.proyecto.model.TareaProyecto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TareaProyectoRequest(
    @NotBlank(message = "El título de la tarea es obligatorio")
    @Size(max = 150, message = "El título no puede superar 150 caracteres")
    String titulo,

    String descripcion,

    Long usuarioId,

    @NotNull(message = "La prioridad es obligatoria")
    TareaProyecto.Prioridad prioridad
) {
}
