package com.casetool.backend.modules.copilot.guia;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.json.JsonMapper;

class ManualRepositorioTest {

    private final List<ManualTema> temas = new ManualRepositorio(JsonMapper.builder().build()).temas();

    @Test
    void cargaLos17TemasConIdsUnicos() {
        assertThat(temas).hasSize(17);
        assertThat(temas).extracting(ManualTema::id).doesNotHaveDuplicates()
                .contains("uml-multiplicidades-nm", "proyecto-crear-practica", "miembros-invitar-roles",
                        "chat-equipo-seniordev", "propuestas-aplicar-adr", "copilot-asistente-guia", "ddl-visor",
                        "guia-primeros-pasos");
    }

    @Test
    void camposCompletosYSeccionesValidas() {
        assertThat(temas).allSatisfy(t -> {
            assertThat(t.titulo()).isNotBlank();
            assertThat(t.resumen()).isNotBlank();
            assertThat(t.contenido()).isNotBlank();
            assertThat(t.palabrasClave()).isNotEmpty();
            assertThat(ManualRepositorio.SECCIONES).contains(t.seccion());
        });
    }

    @Test
    void usaLasEtiquetasRealesDeLaUiYNingunComando() {
        String todo = String.join("\n", temas.stream().map(ManualTema::contenido).toList());
        assertThat(todo).doesNotContain("En Proceso", "Completada", "Guardar como Nota ADR", "Acción:",
                "CREAR_TABLA", "IR_A", "GUIA_PASO");
        assertThat(todo).contains("\"En progreso\"", "\"Hecho\"", "\"Guardar como ADR\"", "\"Entidad\"");
    }
}
