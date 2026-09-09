package com.casetool.backend.modules.diagrama.dto;

import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;

public record RelacionDiagramaResponse(
    Long id,
    Long proyectoId,
    Long entidadOrigenId,
    String entidadOrigenNombre,
    Long entidadDestinoId,
    String entidadDestinoNombre,
    RelacionDiagrama.TipoRelacion tipoRelacion
) {
    public static RelacionDiagramaResponse from(RelacionDiagrama relacion) {
        return new RelacionDiagramaResponse(
            relacion.getId(),
            relacion.getProyecto().getId(),
            relacion.getEntidadOrigen().getId(),
            relacion.getEntidadOrigen().getNombre(),
            relacion.getEntidadDestino().getId(),
            relacion.getEntidadDestino().getNombre(),
            relacion.getTipoRelacion()
        );
    }
}
