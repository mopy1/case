package com.casetool.backend.modules.copilot.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class CopilotConsultaRequestValidationTest {

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

    private static CopilotConsultaRequest req(String texto, String img, String seccion, List<CopilotTurno> h) {
        return new CopilotConsultaRequest(texto, img, seccion, null, h, null);
    }

    private static List<String> mensajes(CopilotConsultaRequest r) {
        return validator.validate(r).stream().map(ConstraintViolation::getMessage).toList();
    }

    @Test
    void requestValidoYTodoOpcional() {
        assertThat(mensajes(req("hola", null, "diagrama", List.of(new CopilotTurno("usuario", "hola"))))).isEmpty();
        assertThat(mensajes(req(null, null, null, null))).isEmpty();
    }

    @Test
    void textoImagenYSeccion() {
        assertThat(mensajes(req("x".repeat(4001), null, null, null))).containsExactly("La consulta no puede superar 4000 caracteres");
        assertThat(mensajes(req(null, "A".repeat(2_000_001), null, null))).containsExactly("La imagen supera el tamaño máximo (1,5 MB)");
        assertThat(mensajes(req("hola", null, "x", null))).containsExactly("Sección inválida");
    }

    @Test
    void historialMaximo6TurnosValidos() {
        List<CopilotTurno> siete = Collections.nCopies(7, new CopilotTurno("usuario", "a"));
        assertThat(mensajes(req("hola", null, null, siete))).containsExactly("Máximo 6 turnos de historial");
        assertThat(mensajes(req("hola", null, null, List.of(new CopilotTurno("sistema", "a"))))).containsExactly("Rol de turno inválido");
        assertThat(mensajes(req("hola", null, null, List.of(new CopilotTurno("usuario", "x".repeat(1501))))))
                .containsExactly("Cada turno puede tener hasta 1500 caracteres");
    }
}
