package com.casetool.backend.modules.diagrama.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;

class PosicionTablaIntermediaTest {

    @Test
    void sinVecinosVaDebajoDelPuntoMedio() {
        EntidadDiagrama a = entidad(1L, 0, 0);
        EntidadDiagrama b = entidad(2L, 600, 0);
        var pos = PosicionTablaIntermedia.calcular(a, b, List.of(a, b));
        assertThat(pos.x()).isEqualTo(300);
        assertThat(pos.y()).isEqualTo(220);
    }

    /** Diagrama de EA importado: docente–grupo N:M con "horario" justo debajo del punto medio. */
    @Test
    void esquivaUnaTablaQueOcupaElLugar() {
        EntidadDiagrama docente = entidad(1L, 80, 90);
        EntidadDiagrama grupo = entidad(2L, 634, 90);
        EntidadDiagrama horario = entidad(3L, 527, 388);
        var pos = PosicionTablaIntermedia.calcular(docente, grupo, List.of(docente, grupo, horario));
        assertThat(Math.abs(pos.x() - horario.getPosX()) >= 290 || Math.abs(pos.y() - horario.getPosY()) >= 200).isTrue();
        assertThat(Math.abs(pos.y() - docente.getPosY())).isGreaterThanOrEqualTo(200);
    }

    private static EntidadDiagrama entidad(Long id, double x, double y) {
        EntidadDiagrama e = new EntidadDiagrama();
        e.setId(id);
        e.setPosX(x);
        e.setPosY(y);
        return e;
    }
}
