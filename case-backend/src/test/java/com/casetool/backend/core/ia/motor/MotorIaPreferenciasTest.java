package com.casetool.backend.core.ia.motor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class MotorIaPreferenciasTest {

    private final MotorIaPreferencias preferencias = new MotorIaPreferencias(new MotorIaUrlValidator("ngrok-free.dev"));

    @Test
    void deepSeekIgnoraLaUrlAunqueVengaYBorraLaPreferencia() {
        preferencias.guardar(1L, MotorIa.QWEN_KAGGLE, "https://abc.ngrok-free.dev");

        assertThat(preferencias.guardar(1L, MotorIa.DEEPSEEK, "cualquier cosa")).isNull();
        assertThat(preferencias.urlKaggle(1L)).isEmpty();
    }

    @Test
    void qwenSinUrlEsInvalido() {
        assertThatThrownBy(() -> preferencias.guardar(1L, MotorIa.QWEN_KAGGLE, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
