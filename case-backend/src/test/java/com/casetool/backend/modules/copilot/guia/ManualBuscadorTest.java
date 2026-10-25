package com.casetool.backend.modules.copilot.guia;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.json.JsonMapper;

class ManualBuscadorTest {

    private final ManualBuscador buscador = new ManualBuscador(new ManualRepositorio(JsonMapper.builder().build()));

    private String primero(String consulta, String seccion) {
        return buscador.buscar(consulta, seccion, 1).get(0).id();
    }

    @Test
    void relacionMuchosAMuchosEncuentraMultiplicidades() {
        assertThat(primero("relación muchos a muchos", null)).isEqualTo("uml-multiplicidades-nm");
    }

    @Test
    void ignoraTildesMayusculasYPlurales() {
        assertThat(primero("RELACIONES", "diagrama")).isEqualTo("uml-multiplicidades-nm");
        assertThat(primero("¿Cómo invito colaboradores?", null)).isEqualTo("miembros-invitar-roles");
        assertThat(primero("exportar a enterprise architect", null)).isEqualTo("xmi-interoperabilidad");
    }

    @Test
    void vacioOSoloStopwordsNoDevuelveNada() {
        assertThat(buscador.buscar("", "diagrama", 2)).isEmpty();
        assertThat(buscador.buscar("¿cómo lo hago para usar esto?", null, 2)).isEmpty();
        assertThat(buscador.buscar("zzzz", null, 2)).isEmpty();
    }

    @Test
    void respetaElLimite() {
        assertThat(buscador.buscar("tabla atributo relacion", null, 2)).hasSize(2);
    }

    @Test
    void laSeccionDesempataAFavorDelTemaDeLaSeccion() {
        // "papelera" solo aparece en el contenido de uml-canvas-entidades (primero en el archivo) y de
        // tareas-kanban: sin sección gana el orden del archivo, con sección "tareas" gana el bono +2.
        assertThat(primero("papelera", null)).isEqualTo("uml-canvas-entidades");
        assertThat(primero("papelera", "tareas")).isEqualTo("tareas-kanban");
    }

    @Test
    void tokensNormalizaYQuitaStopwordsYPlurales() {
        assertThat(ManualBuscador.tokens("¿Cómo hago las Relaciones N:M?")).containsExactly("relacion");
        assertThat(ManualBuscador.singular("tablas")).isEqualTo("tabla");
        assertThat(ManualBuscador.singular("mes")).isEqualTo("mes");
    }
}
