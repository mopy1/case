package com.casetool.backend.modules.proyecto.dto;

import java.time.Instant;

import com.casetool.backend.modules.proyecto.model.NotaProyecto;

public record NotaProyectoResponse(
    Long id,
    Long usuarioId,
    String username,
    String accion,
    String motivo,
    Instant createdAt
) {
    public static NotaProyectoResponse from(NotaProyecto nota) {
        return new NotaProyectoResponse(
            nota.getId(),
            nota.getUsuario().getId(),
            nota.getUsuario().getUsername(),
            nota.getAccion(),
            nota.getMotivo(),
            nota.getCreatedAt()
        );
    }
}
