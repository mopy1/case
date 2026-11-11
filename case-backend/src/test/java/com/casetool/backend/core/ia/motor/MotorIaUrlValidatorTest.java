package com.casetool.backend.core.ia.motor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class MotorIaUrlValidatorTest {

    private final MotorIaUrlValidator validator = new MotorIaUrlValidator("ngrok-free.dev, ngrok.io");

    @Test
    void normalizaQuitandoBarraFinalYAgregandoV1() {
        assertThat(validator.normalizar("https://visible-banister-durable.ngrok-free.dev/v1/"))
                .isEqualTo("https://visible-banister-durable.ngrok-free.dev/v1");
        assertThat(validator.normalizar(" https://ABC.ngrok-free.dev "))
                .isEqualTo("https://abc.ngrok-free.dev/v1");
        assertThat(validator.normalizar("https://abc.ngrok.io:443/api")).isEqualTo("https://abc.ngrok.io/api/v1");
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "http://abc.ngrok-free.dev/v1",          // sin https
        "https://169.254.169.254/v1",            // metadata de la nube
        "https://localhost/v1",
        "https://evilngrok-free.dev/v1",         // sufijo sin punto
        "https://ngrok-free.dev/v1",             // sin subdominio
        "https://abc.ngrok-free.dev.evil.com/v1",
        "https://user:pass@abc.ngrok-free.dev/v1",
        "https://abc.ngrok-free.dev:8080/v1",
        "https://abc.ngrok-free.dev/v1?x=1",
        "no es una url",
        ""
    })
    void rechazaLoQueNoEsUnTunelNgrokHttps(String url) {
        assertThatThrownBy(() -> validator.normalizar(url)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void nullTambienEsInvalida() {
        assertThatThrownBy(() -> validator.normalizar(null)).isInstanceOf(IllegalArgumentException.class);
    }
}
