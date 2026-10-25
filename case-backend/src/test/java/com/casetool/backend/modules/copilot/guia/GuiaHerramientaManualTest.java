package com.casetool.backend.modules.copilot.guia;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.casetool.backend.core.ia.dto.DeepSeekToolCall;

import tools.jackson.databind.json.JsonMapper;

class GuiaHerramientaManualTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private final GuiaHerramientaManual h = new GuiaHerramientaManual(new ManualBuscador(new ManualRepositorio(JSON)), JSON);

    private static DeepSeekToolCall call(String args) {
        return new DeepSeekToolCall("c", "function", new DeepSeekToolCall.Funcion("buscarManual", args));
    }

    @Test
    void devuelveLos2MejoresTemasConSeccionRecortado() {
        String r = h.ejecutar(call("{\"consulta\":\"relación muchos a muchos\"}"), "diagrama");

        assertThat(r).startsWith("### Relaciones, multiplicidades y relaciones N:M (sección diagrama)\n");
        assertThat(r.split("\n### ")).hasSize(2);
        assertThat(r.length()).isLessThanOrEqualTo(3001);
    }

    @Test
    void sinResultadosYArgumentosMalos() {
        assertThat(h.ejecutar(call("{\"consulta\":\"zzzz\"}"), null)).isEqualTo("SIN_RESULTADOS: el manual no cubre «zzzz»");
        assertThat(h.ejecutar(call("{}"), null)).isEqualTo("ERROR: falta el argumento consulta");
        assertThat(h.ejecutar(call("{malo"), null)).isEqualTo("ERROR: argumentos JSON inválidos");
    }
}
