package com.casetool.backend.modules.proyecto.dto;

import java.time.Instant;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;

public record ProyectoResponse(
    Long id,
    String nombre,
    String descripcion,
    String miRol,
    Instant createdAt
) {
    public static ProyectoResponse from(Proyecto proyecto, MiembroProyecto.Rol rol) {
        return new ProyectoResponse(
            proyecto.getId(),
            proyecto.getNombre(),
            proyecto.getDescripcion(),
            rol != null ? rol.name() : null,
            proyecto.getCreatedAt()
        );
    }
}
