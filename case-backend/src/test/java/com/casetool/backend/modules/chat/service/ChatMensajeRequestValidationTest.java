package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.chat.dto.ChatMensajeRequest;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/** Bean Validation del body del POST (lo que Spring convierte en 400 con @Valid). */
class ChatMensajeRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void crear() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void cerrar() {
        factory.close();
    }

    @Test
    void rechazaVacioSoloEspaciosYMasDe4000() {
        assertThat(validator.validate(new ChatMensajeRequest(null))).hasSize(1);
        assertThat(validator.validate(new ChatMensajeRequest("   ")))
                .extracting(v -> v.getMessage()).containsExactly("El mensaje no puede estar vacío");
        assertThat(validator.validate(new ChatMensajeRequest("x".repeat(4001))))
                .extracting(v -> v.getMessage()).containsExactly("El mensaje no puede superar 4000 caracteres");
    }

    @Test
    void acepta4000Caracteres() {
        assertThat(validator.validate(new ChatMensajeRequest("x".repeat(4000)))).isEmpty();
    }
}
