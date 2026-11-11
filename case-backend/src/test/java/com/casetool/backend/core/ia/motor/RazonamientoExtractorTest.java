package com.casetool.backend.core.ia.motor;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.casetool.backend.core.ia.dto.DeepSeekMensaje;

class RazonamientoExtractorTest {

    private static DeepSeekMensaje asistente(String content, String reasoning) {
        return new DeepSeekMensaje("assistant", content, null, null, reasoning);
    }

    @Test
    void sacaElBloqueThinkYDejaLosComandosDelFinalIntactos() {
        DeepSeekMensaje m = RazonamientoExtractor.normalizar(asistente(
                "<think>\nEl usuario quiere Libro.\n</think>\n\nCreo la tabla.\nCREAR_TABLA: [Libro] (x: 80, y: 80)", null));

        assertThat(m.reasoning_content()).isEqualTo("El usuario quiere Libro.");
        assertThat(m.content()).isEqualTo("Creo la tabla.\nCREAR_TABLA: [Libro] (x: 80, y: 80)");
    }

    @Test
    void cierreSinAperturaCuandoElTemplateAbrioElTag() {
        DeepSeekMensaje m = RazonamientoExtractor.normalizar(asistente("pienso…</think>Respuesta", null));

        assertThat(m.reasoning_content()).isEqualTo("pienso…");
        assertThat(m.content()).isEqualTo("Respuesta");
    }

    @Test
    void thinkSinCerrarEsTodoRazonamientoYElContenidoQuedaVacio() {
        DeepSeekMensaje m = RazonamientoExtractor.normalizar(asistente("<think>me quedé sin tokens", null));

        assertThat(m.reasoning_content()).isEqualTo("me quedé sin tokens");
        assertThat(m.estaVacio()).isTrue();
    }

    @Test
    void preferElReasoningContentDelServidor() {
        DeepSeekMensaje m = RazonamientoExtractor.normalizar(asistente("Hola", " del servidor "));

        assertThat(m.reasoning_content()).isEqualTo("del servidor");
        assertThat(m.content()).isEqualTo("Hola");
    }

    @Test
    void sinRazonamientoQuedaNull() {
        DeepSeekMensaje m = RazonamientoExtractor.normalizar(asistente("Solo texto", null));

        assertThat(m.reasoning_content()).isNull();
        assertThat(m.content()).isEqualTo("Solo texto");
    }
}
