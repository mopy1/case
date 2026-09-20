package com.casetool.backend.modules.diagrama.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;

public record ActualizarPuntosControlRequest(
    @NotNull(message = "La lista de puntos es obligatoria (puede ser vacía)")
    List<PuntoControlDto> puntos
) {
}
