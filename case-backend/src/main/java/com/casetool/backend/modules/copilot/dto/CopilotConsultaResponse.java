package com.casetool.backend.modules.copilot.dto;

import java.util.List;

import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.core.ia.motor.MotorIaContexto;

/**
 * Texto crudo del modelo (el frontend lo parsea en tarjetas) + origen + herramientas usadas (o null)
 * + razonamiento del modelo (solo Qwen en Kaggle lo trae; null en el resto).
 */
public record CopilotConsultaResponse(String texto, OrigenRespuesta origen, List<String> herramientasUsadas,
        String razonamiento) {

    /** Respuesta sin razonamiento (Gemini, manual, degradación sin herramientas). */
    public CopilotConsultaResponse(String texto, OrigenRespuesta origen, List<String> herramientasUsadas) {
        this(texto, origen, herramientasUsadas, null);
    }

    /** Respuesta del motor de chat: origen = motor que respondió en este pedido, con su razonamiento. */
    public static CopilotConsultaResponse deIa(DeepSeekMensaje m, List<String> herramientasUsadas) {
        String texto = m.content() != null ? m.content().trim() : "";
        return new CopilotConsultaResponse(texto, OrigenRespuesta.deMotor(MotorIaContexto.motorUsado()),
                herramientasUsadas, m.reasoning_content());
    }
}
