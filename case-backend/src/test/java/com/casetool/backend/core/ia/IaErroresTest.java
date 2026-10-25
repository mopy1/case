package com.casetool.backend.core.ia;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

class IaErroresTest {

    @Test
    void timeout() {
        assertThat(IaErrores.motivo(new ResourceAccessException("I/O error: Read timed out"))).isEqualTo("Tiempo de espera agotado");
    }

    @Test
    void noAutorizado() {
        assertThat(IaErrores.motivo(HttpClientErrorException.create(HttpStatus.UNAUTHORIZED, "Unauthorized", null, null, null)))
                .isEqualTo("Error de autenticación con el proveedor");
    }

    @Test
    void limiteDeSolicitudes() {
        assertThat(IaErrores.motivo(HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "Too Many", null, null, null)))
                .isEqualTo("Límite de solicitudes excedido");
    }

    @Test
    void genericoYVacio() {
        assertThat(IaErrores.motivo(new IllegalStateException("Respuesta vacía del proveedor de IA")))
                .isEqualTo("Respuesta vacía del proveedor de IA");
        assertThat(IaErrores.motivo(new RuntimeException())).isEqualTo("Error del proveedor de IA");
        assertThat(IaErrores.motivo(new RuntimeException("x".repeat(500)))).hasSize(161);
    }
}
