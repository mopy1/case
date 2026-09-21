package com.casetool.backend.modules.diagrama.dto;

import java.util.List;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;

public record RelacionDiagramaResponse(
    Long id,
    Long proyectoId,
    Long entidadOrigenId,
    String entidadOrigenNombre,
    Long entidadDestinoId,
    String entidadDestinoNombre,
    RelacionDiagrama.Multiplicidad multiplicidadOrigen,
    RelacionDiagrama.Multiplicidad multiplicidadDestino,
    List<PuntoControlDto> puntosControl,
    RelacionDiagrama.TipoRelacionUml tipo
) {
    public static RelacionDiagramaResponse from(RelacionDiagrama relacion) {
        return new RelacionDiagramaResponse(
            relacion.getId(),
            relacion.getProyecto().getId(),
            relacion.getEntidadOrigen().getId(),
            relacion.getEntidadOrigen().getNombre(),
            relacion.getEntidadDestino().getId(),
            relacion.getEntidadDestino().getNombre(),
            relacion.getMultiplicidadOrigen(),
            relacion.getMultiplicidadDestino(),
            relacion.getPuntosControl() == null
                ? List.of()
                : relacion.getPuntosControl().stream()
                    .map(p -> new PuntoControlDto(p.getX(), p.getY()))
                    .toList(),
            relacion.getTipo() == null ? RelacionDiagrama.TipoRelacionUml.ASOCIACION : relacion.getTipo()
        );
    }
}
