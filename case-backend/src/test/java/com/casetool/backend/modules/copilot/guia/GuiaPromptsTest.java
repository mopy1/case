package com.casetool.backend.modules.copilot.guia;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class GuiaPromptsTest {

    @Test
    void listaLos14PasosDelFrontend() {
        assertThat(GuiaPrompts.PASOS).hasSize(14).doesNotHaveDuplicates();
        GuiaPrompts.PASOS.forEach(id -> assertThat(GuiaPrompts.SYSTEM).contains("- " + id + ":"));
    }

    @Test
    void prohibeComandosQueModificanYPermiteIrAYGuiaPaso() {
        assertThat(GuiaPrompts.SYSTEM).contains("PROHIBIDO", "CREAR_TABLA", "CREAR_RELACION", "ADR_SUGERIDA",
                "IR_A: [diagrama|tareas|notas|xmi|generador]", "GUIA_PASO: [id]", "buscarManual", "\"Asistente\"");
    }

    @Test
    void voseoSinEmojisPrimeraMisionYLector() {
        assertThat(GuiaPrompts.SYSTEM).contains("voseo", "sin emojis", "120 palabras", "PRIMERA misión pendiente", "LECTOR",
                "no le sugieras el modo \"Asistente\"");
        assertThat(GuiaPrompts.SYSTEM.codePoints().noneMatch(c -> c >= 0x1F300)).isTrue();
    }
}
