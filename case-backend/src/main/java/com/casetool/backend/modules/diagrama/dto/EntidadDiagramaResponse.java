package com.casetool.backend.modules.diagrama.dto;

import java.time.Instant;
import java.util.List;

import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;

public record EntidadDiagramaResponse(
    Long id,
    Long proyectoId,
    String nombre,
    Double posX,
    Double posY,
    List<AtributoEntidadResponse> atributos,
    Instant createdAt
) {
    public static EntidadDiagramaResponse from(EntidadDiagrama entidad, List<AtributoEntidadResponse> atributos) {
        return new EntidadDiagramaResponse(
            entidad.getId(),
            entidad.getProyecto().getId(),
            entidad.getNombre(),
            entidad.getPosX(),
            entidad.getPosY(),
            atributos,
            entidad.getCreatedAt()
        );
    }
}
