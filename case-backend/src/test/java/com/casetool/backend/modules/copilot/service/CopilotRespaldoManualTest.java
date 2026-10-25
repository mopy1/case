package com.casetool.backend.modules.copilot.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;
import com.casetool.backend.modules.copilot.guia.ManualBuscador;
import com.casetool.backend.modules.copilot.guia.ManualRepositorio;

import tools.jackson.databind.json.JsonMapper;

/** Con el manual real (resources/guia/manual.json): es lo que ve el usuario sin DEEPSEEK_API_KEY. */
class CopilotRespaldoManualTest {

    private static final ManualRepositorio REPO = new ManualRepositorio(JsonMapper.builder().build());
    private final CopilotRespaldoManual respaldo = new CopilotRespaldoManual(new ManualBuscador(REPO), REPO);

    @Test
    void avisaElMotivoYMuestraElTemaMasRelevanteConSuAdr() {
        CopilotConsultaResponse r = respaldo.responder("¿cómo hago una relación muchos a muchos?", "diagrama",
                "Clave de API no configurada");

        assertThat(r.origen()).isEqualTo(OrigenRespuesta.MANUAL);
        assertThat(r.herramientasUsadas()).isNull();
        assertThat(r.texto())
                .startsWith("_El asistente IA no está disponible ahora (Clave de API no configurada). Te muestro lo que dice el manual._\n\n### Relaciones, multiplicidades y relaciones N:M")
                .contains("ADR_SUGERIDA: [Normalizar la relación N:M con una tabla intermedia]\nMOTIVO: [");
    }

    @Test
    void temaSinAdrNoAgregaComandos() {
        assertThat(respaldo.responder("tablero kanban", "tareas", "x").texto())
                .contains("### Tablero de tareas (Kanban)").doesNotContain("ADR_SUGERIDA");
    }

    @Test
    void sinResultadosOfreceLosTitulosDeLaSeccion() {
        String texto = respaldo.responder("zzzz qwerty", "xmi", "x").texto();

        assertThat(texto).contains("Puedo explicarte: Exportar e importar XMI (Enterprise Architect).");
    }
}
