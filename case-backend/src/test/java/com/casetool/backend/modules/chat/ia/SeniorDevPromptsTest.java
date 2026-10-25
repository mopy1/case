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

    @Test
    void promptF3ContieneHiloHerramientasYGenerarDdl() {
        assertThat(SeniorDevPrompts.SYSTEM_PROMPT)
                .contains("GENERAR_DDL")
                .contains("abre tu respuesta con el @username")
                .contains("usa las herramientas (obtenerDiagrama, listarTareas, listarNotas, buscarEnHistorial)")
                .contains("Nunca inventes datos");
        assertThat(SeniorDevPrompts.RESUMEN_PROMPT)
                .contains("**Decisiones**")
                .contains("Máximo 1800 caracteres");
    }

    @Test
    void promptProhibeAfirmarConsultasNoHechas() {
        assertThat(SeniorDevPrompts.SYSTEM_PROMPT)
                .contains("nunca afirmes que revisaste, consultaste o buscaste algo")
                .contains("si en este turno no llamaste a la herramienta correspondiente")
                .contains("llama a la herramienta en lugar de suponer");
    }

    @Test
    void promptDejaVerElDdlACualquierMiembroYRespondeSoloAlAutor() {
        assertThat(SeniorDevPrompts.SYSTEM_PROMPT)
                .contains("CUALQUIER miembro (ADMIN, COLABORADOR o LECTOR) puede ver, copiar y descargar el DDL")
                .contains("Solo aplicar propuestas de cambio")
                .contains("Nunca le digas a un LECTOR que no puede ver o generar el DDL")
                .contains("una ADR solo existe si aparece en \"ADR recientes\" o en listarNotas")
                .contains("Respondes a una sola persona")
                .doesNotContain("respóndeles a cada uno");
    }
}
