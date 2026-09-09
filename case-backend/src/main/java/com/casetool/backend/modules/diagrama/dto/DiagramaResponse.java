package com.casetool.backend.modules.diagrama.dto;

import java.util.List;

/** Todo el lienzo de un proyecto en una sola respuesta — evita N+1 requests al cargar el canvas. */
public record DiagramaResponse(
    List<EntidadDiagramaResponse> entidades,
    List<RelacionDiagramaResponse> relaciones
) {
}
