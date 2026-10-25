package com.casetool.backend.modules.copilot.service;

import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.core.ia.GeminiVisionClient;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;

/** Foto de un diagrama → Gemini. Sin clave o si fallan todos los modelos, la excepción da 503. */
@Component
public class CopilotVision {

    static final String TEXTO_POR_DEFECTO =
            "Analiza esta imagen y extrae el diagrama UML con sus tablas, atributos y relaciones.";

    private final GeminiVisionClient gemini;

    public CopilotVision(GeminiVisionClient gemini) {
        this.gemini = gemini;
    }

    public CopilotConsultaResponse responder(String texto, String imagenBase64, DiagramaResponse diagrama) {
        String nombres = diagrama.entidades().stream().map(EntidadDiagramaResponse::nombre).collect(Collectors.joining(", "));
        String consulta = texto == null || texto.isBlank() ? TEXTO_POR_DEFECTO : texto;
        String respuesta = gemini.analizar(CopilotPrompts.vision(nombres), consulta, imagenBase64);
        return new CopilotConsultaResponse(respuesta, OrigenRespuesta.GEMINI, null);
    }
}
