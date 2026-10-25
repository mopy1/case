package com.casetool.backend.modules.copilot.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.copilot.CopilotFixtures;

class CopilotPromptsTest {

    @Test
    void listaTablasYRelacionesConElFormatoDelFront() {
        String p = CopilotPrompts.asistente("diagrama", CopilotFixtures.libroAutor());

        assertThat(p).contains("Sección actual: \"diagrama\".")
                .contains("- Libro (x:80, y:80) [id:BIGINT:PK, titulo:VARCHAR]")
                .contains("- Autor (x:420.5, y:80) [sin atributos]")
                .contains("RELACIONES ACTUALES: - Autor (UNO) -> (UNO_O_MAS) Libro")
                .contains("Próxima posición libre recomendada: x: 760, y: 80.");
    }

    @Test
    void diagramaVacioUsaLosTextosFijos() {
        String p = CopilotPrompts.asistente("general", CopilotFixtures.vacio());

        assertThat(p).contains("TABLAS ACTUALES: Sin tablas en el lienzo.")
                .contains("RELACIONES ACTUALES: Sin relaciones en el lienzo.")
                .contains("x: 80, y: 80.");
    }

    @Test
    void conservaComandosYReglasDeSeguridad() {
        String p = CopilotPrompts.asistente("diagrama", CopilotFixtures.vacio());

        assertThat(p).contains("CREAR_TABLA: [Nombre] (x: 100, y: 100)", "ATRIBUTOS: [id:BIGINT:PK, campo:VARCHAR]",
                "CREAR_RELACION:", "AGREGAR_ATRIBUTO:", "ELIMINAR_TABLA:", "CREAR_TAREA:", "IR_A: [sección]",
                "ADR_SUGERIDA: [Acción clara] \\n MOTIVO:", "PROHIBIDO ELIMINAR SIN ORDEN DIRECTA",
                "CONSERVA TODAS LAS TABLAS", "SOLO INFORMACIÓN, CERO COMANDOS");
        assertThat(p).doesNotEndWith("\n");
    }

    @Test
    void visionIncluyeLasTablasExistentesONinguna() {
        assertThat(CopilotPrompts.vision("Libro, Autor")).contains("Tablas existentes en el proyecto: Libro, Autor.");
        assertThat(CopilotPrompts.vision("")).contains("Tablas existentes en el proyecto: Ninguna.")
                .contains("CREAR_RELACION: [TablaOrigen] -> [TablaDestino] (1 a N)");
    }

    @Test
    void numeroComoJavaScript() {
        assertThat(CopilotPrompts.numero(80.0)).isEqualTo("80");
        assertThat(CopilotPrompts.numero(80.25)).isEqualTo("80.25");
        assertThat(CopilotPrompts.numero(null)).isEqualTo("0");
    }
}
