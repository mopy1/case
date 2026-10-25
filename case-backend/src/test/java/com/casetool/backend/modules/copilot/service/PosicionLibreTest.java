package com.casetool.backend.modules.copilot.service;

import static com.casetool.backend.modules.copilot.CopilotFixtures.entidad;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class PosicionLibreTest {

    @Test
    void lienzoVacioEmpiezaEn80x80() {
        assertThat(PosicionLibre.calcular(List.of())).isEqualTo(new PosicionLibre.Posicion(80, 80));
    }

    @Test
    void primeraCeldaOcupadaPasaALaSegundaColumna() {
        assertThat(PosicionLibre.calcular(List.of(entidad(1, "A", 80, 80)))).isEqualTo(new PosicionLibre.Posicion(420, 80));
    }

    @Test
    void conLaPrimeraFilaLlenaBajaALaSegunda() {
        var fila = List.of(entidad(1, "A", 80, 80), entidad(2, "B", 420, 80), entidad(3, "C", 760, 80));
        assertThat(PosicionLibre.calcular(fila)).isEqualTo(new PosicionLibre.Posicion(80, 360));
    }

    @Test
    void unaTablaCorridaBloqueaLasDosCeldasQueToca() {
        // |420 - 150| = 270 < 270 + 30 de margen: también choca con la segunda columna.
        assertThat(PosicionLibre.calcular(List.of(entidad(1, "A", 150, 120)))).isEqualTo(new PosicionLibre.Posicion(760, 80));
    }
}
