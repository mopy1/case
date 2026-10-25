package com.casetool.backend.modules.copilot.guia;

import java.util.List;

import com.casetool.backend.modules.copilot.dto.CopilotTurno;
import com.casetool.backend.modules.copilot.dto.MisionGuia;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;

/** Todo lo que la Guía necesita para responder una pregunta (ya validado por CopilotService). */
public record GuiaContexto(
    Long proyectoId,
    String username,
    MiembroProyecto.Rol rol,
    String seccion,
    String pregunta,
    DiagramaResponse diagrama,
    List<CopilotTurno> historial,
    List<MisionGuia> misionesPendientes
) {
}
