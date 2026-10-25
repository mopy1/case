package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SeniorDevPromptsTest {

    @Test
    void promptContieneReglasCeroSqlYComandosEstructurados() {
        String prompt = SeniorDevPrompts.SYSTEM_PROMPT;

        assertThat(prompt)
                .contains("ESTRICTAMENTE PROHIBIDO entregar código fuente")
                .contains("sentencias SQL")
                .contains("CREAR_TABLA: [Nombre] (x: posX, y: posY)")
                .contains("AGREGAR_ATRIBUTO: [NombreTabla]")
                .contains("CREAR_RELACION: [Origen] -> [Destino]")
                .contains("ELIMINAR_RELACION: [Origen] -> [Destino]")
                .contains("ELIMINAR_TABLA: [NombreTabla]")
                .contains("CREAR_TAREA: [Título] | [Descripción técnica] | [ALTA/MEDIA/BAJA]")
                .contains("ADR_SUGERIDA: [Acción clara]")
                .contains("MOTIVO: [Justificación técnica concisa]");
    }

    @Test
    void promptContieneReglasDeLegibilidadYFormatoParrafos() {
        String prompt = SeniorDevPrompts.SYSTEM_PROMPT;

        assertThat(prompt)
                .contains("FORMATO Y LEGIBILIDAD")
                .contains("DOBLE SALTO DE LÍNEA")
                .contains("LISTAS COMPACTAS")
                .contains("ÚNICO salto de línea")
                .contains("Aprovecha el formato Markdown para resaltar conceptos o términos clave");
    }
}
