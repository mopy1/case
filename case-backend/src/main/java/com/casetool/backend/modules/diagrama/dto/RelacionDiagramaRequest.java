package com.casetool.backend.modules.diagrama.dto;

import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import jakarta.validation.constraints.NotNull;

public record RelacionDiagramaRequest(
    @NotNull(message = "La entidad de origen es obligatoria")
    Long entidadOrigenId,

    @NotNull(message = "La entidad de destino es obligatoria")
    Long entidadDestinoId,

    @NotNull(message = "El tipo de relación es obligatorio")
    RelacionDiagrama.TipoRelacion tipoRelacion
) {
}
