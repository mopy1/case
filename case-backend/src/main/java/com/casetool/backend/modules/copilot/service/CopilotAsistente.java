package com.casetool.backend.modules.copilot.service;

import static com.casetool.backend.modules.copilot.service.CopilotLimites.ASISTENTE_MAX_TOKENS;
import static com.casetool.backend.modules.copilot.service.CopilotLimites.ASISTENTE_TEMPERATURA;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.IaErrores;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;

/** Modo Asistente (texto, un solo turno): prompt con el diagrama → DeepSeek → texto crudo con comandos. */
@Component
public class CopilotAsistente {

    private static final Logger log = LoggerFactory.getLogger(CopilotAsistente.class);

    private final DeepSeekClient deepSeek;
    private final CopilotRespaldoManual respaldo;

    public CopilotAsistente(DeepSeekClient deepSeek, CopilotRespaldoManual respaldo) {
        this.deepSeek = deepSeek;
        this.respaldo = respaldo;
    }

    public CopilotConsultaResponse responder(String texto, String seccion, DiagramaResponse diagrama) {
        if (!deepSeek.tieneApiKey()) {
            return respaldo.responder(texto, seccion, "Clave de API no configurada");
        }
        try {
            List<DeepSeekMensaje> mensajes = List.of(
                    DeepSeekMensaje.system(CopilotPrompts.asistente(seccion, diagrama)),
                    DeepSeekMensaje.user(texto));
            String respuesta = deepSeek.solicitarRespuesta(mensajes, ASISTENTE_TEMPERATURA, ASISTENTE_MAX_TOKENS);
            return new CopilotConsultaResponse(respuesta, OrigenRespuesta.DEEPSEEK, null);
        } catch (Exception ex) {
            log.warn("El Copilot no pudo consultar a DeepSeek: {}", ex.getMessage());
            return respaldo.responder(texto, seccion, IaErrores.motivo(ex));
        }
    }
}
