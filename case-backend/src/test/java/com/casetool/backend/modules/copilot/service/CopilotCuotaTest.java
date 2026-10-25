package com.casetool.backend.modules.copilot.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.copilot.exception.CopilotCuotaExcedidaException;

class CopilotCuotaTest {

    /** Reloj que avanza a mano. */
    private static final class Reloj extends Clock {
        Instant ahora = Instant.parse("2026-10-25T12:00:00Z");
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return ahora; }
    }

    private final Reloj reloj = new Reloj();
    private final CopilotCuota cuota = new CopilotCuota(reloj);

    @Test
    void veinteConsultasPasanYLaVeintiunaDa429() {
        for (int i = 0; i < 20; i++) cuota.registrar(1L);

        assertThatThrownBy(() -> cuota.registrar(1L))
                .isInstanceOf(CopilotCuotaExcedidaException.class)
                .hasMessage("Hiciste muchas consultas seguidas. Esperá un minuto.");
    }

    @Test
    void laCuotaEsPorUsuario() {
        for (int i = 0; i < 20; i++) cuota.registrar(1L);

        assertThatCode(() -> cuota.registrar(2L)).doesNotThrowAnyException();
    }

    @Test
    void seLiberaAlSalirDeLaVentanaDe60Segundos() {
        for (int i = 0; i < 20; i++) cuota.registrar(1L);
        reloj.ahora = reloj.ahora.plus(Duration.ofSeconds(59));
        assertThatThrownBy(() -> cuota.registrar(1L)).isInstanceOf(CopilotCuotaExcedidaException.class);

        reloj.ahora = reloj.ahora.plus(Duration.ofSeconds(1));
        assertThatCode(() -> cuota.registrar(1L)).doesNotThrowAnyException();
    }
}
