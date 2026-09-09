package com.casetool.backend.modules.proyecto.dto;

import java.time.Instant;

import com.casetool.backend.modules.proyecto.model.TareaProyecto;

public record TareaProyectoResponse(
    Long id,
    Long proyectoId,
    Long usuarioId,
    String usuarioUsername,
    String titulo,
    String descripcion,
    TareaProyecto.Prioridad prioridad,
    TareaProyecto.Estado estado,
    Instant createdAt
) {
    public static TareaProyectoResponse from(TareaProyecto tarea) {
        return new TareaProyectoResponse(
            tarea.getId(),
            tarea.getProyecto().getId(),
            tarea.getUsuario() != null ? tarea.getUsuario().getId() : null,
            tarea.getUsuario() != null ? tarea.getUsuario().getUsername() : null,
            tarea.getTitulo(),
            tarea.getDescripcion(),
            tarea.getPrioridad(),
            tarea.getEstado(),
            tarea.getCreatedAt()
        );
    }
}
