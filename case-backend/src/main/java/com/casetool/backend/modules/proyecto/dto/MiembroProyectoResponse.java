package com.casetool.backend.modules.proyecto.dto;

import java.time.Instant;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;

public record MiembroProyectoResponse(
    Long id,
    Long usuarioId,
    String username,
    String email,
    MiembroProyecto.Rol rol,
    Instant createdAt
) {
    public static MiembroProyectoResponse from(MiembroProyecto miembro) {
        return new MiembroProyectoResponse(
            miembro.getId(),
            miembro.getUsuario().getId(),
            miembro.getUsuario().getUsername(),
            miembro.getUsuario().getEmail(),
            miembro.getRol(),
            miembro.getCreatedAt()
        );
    }
}
