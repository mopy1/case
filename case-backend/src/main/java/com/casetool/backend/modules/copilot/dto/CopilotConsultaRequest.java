package com.casetool.backend.modules.copilot.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body de POST /copilot/consultas. {@code modo} null = ASISTENTE; historial y misiones solo los usa la Guía. */
public record CopilotConsultaRequest(
    @Size(max = 4000, message = "La consulta no puede superar 4000 caracteres") String texto,
    @Size(max = 2_000_000, message = "La imagen supera el tamaño máximo (1,5 MB)") String imagenBase64,
    @Pattern(regexp = "diagrama|tareas|notas|xmi|generador|general", message = "Sección inválida") String seccion,
    ModoCopilot modo,
    @Size(max = 6, message = "Máximo 6 turnos de historial") List<@Valid CopilotTurno> historial,
    @Size(max = 7, message = "Máximo 7 misiones") List<MisionGuia> misionesPendientes
) {
}
