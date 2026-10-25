package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ChatMencionIaUtilsTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "@SeniorDev ¿cómo normalizamos la tabla?",
            "@seniordev",
            "@SENIORDEV hola",
            "@SeniorDev: ayuda con este diseño",
            "¿Qué opinas @SeniorDev?",
            "Revisa esto @seniordev, por favor.",
            "Pregunta para @seniordev; gracias",
            "Hola @SeniorDev! Qué opinas?",
            "Atención @seniordev\nNueva tabla creada"
    })
    void detectaMencionesValidas(String texto) {
        assertThat(ChatMencionIaUtils.contieneMencionSeniorDev(texto)).isTrue();
        assertThat(ChatMencionIaUtils.contieneMencionIa(texto)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "   ",
            "Hola equipo, revisemos el diagrama",
            "@seniordeveloper no debería coincidir",
            "correo@seniordev.com no es mención",
            "contacto@seniordev"
    })
    void rechazaTextosSinMencionValida(String texto) {
        assertThat(ChatMencionIaUtils.contieneMencionSeniorDev(texto)).isFalse();
        assertThat(ChatMencionIaUtils.contieneMencionIa(texto)).isFalse();
    }

    @Test
    void textoNuloDevuelveFalso() {
        assertThat(ChatMencionIaUtils.contieneMencionSeniorDev(null)).isFalse();
        assertThat(ChatMencionIaUtils.contieneMencionIa(null)).isFalse();
    }
}
