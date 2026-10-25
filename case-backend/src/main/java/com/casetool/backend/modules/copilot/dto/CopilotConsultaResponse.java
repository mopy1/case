package com.casetool.backend.modules.copilot.dto;

import java.util.List;

/** Texto crudo del modelo (el frontend lo parsea en tarjetas) + origen + herramientas usadas (o null). */
public record CopilotConsultaResponse(String texto, OrigenRespuesta origen, List<String> herramientasUsadas) {
}
