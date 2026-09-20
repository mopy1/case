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
    List<PuntoControlDto> puntosControl
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
            // `getPuntosControl()` puede venir `null` en filas creadas antes de que existiera la
            // columna — `ddl-auto=update` la agrega con NULL en las filas viejas, sin backfillear
            // `[]` (eso hace falta a mano, ver la migración real de abajo); el default del modelo
            // (`= new ArrayList<>()`) solo aplica antes de que Hibernate hidrate la fila, así que
            // no cubre este caso.
            relacion.getPuntosControl() == null
                ? List.of()
                : relacion.getPuntosControl().stream()
                    .map(p -> new PuntoControlDto(p.getX(), p.getY()))
                    .toList()
        );
    }
}
