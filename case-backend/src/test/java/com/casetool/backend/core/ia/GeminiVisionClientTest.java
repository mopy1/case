package com.casetool.backend.core.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class GeminiVisionClientTest {

    private static final String BASE = "https://gemini.test/v1beta";
    private static final String OK = """
            {"candidates":[{"content":{"parts":[{"text":"CREAR_TABLA: [Libro] (x: 100, y: 100)"}]}}]}""";

    private MockRestServiceServer server;
    private RestClient restClient;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE);
        server = MockRestServiceServer.bindTo(builder).build();
        restClient = builder.build();
    }

    private GeminiVisionClient cliente(String clave) {
        return new GeminiVisionClient(clave, List.of("m1", "m2"), restClient, 45_000);
    }

    @Test
    void siElPrimerModeloDa404PruebaElSegundoConLaClaveEnElHeader() {
        server.expect(requestTo(BASE + "/models/m1:generateContent")).andExpect(method(HttpMethod.POST))
                .andRespond(withResourceNotFound());
        server.expect(requestTo(BASE + "/models/m2:generateContent"))
                .andExpect(header("x-goog-api-key", "clave-g"))
                .andExpect(jsonPath("$.contents[0].parts[1].inlineData.mimeType").value("image/jpeg"))
                .andExpect(jsonPath("$.contents[0].parts[1].inlineData.data").value("QUJD"))
                .andExpect(jsonPath("$.systemInstruction.parts[0].text").value("instr"))
                .andRespond(withSuccess(OK, MediaType.APPLICATION_JSON));

        String r = cliente("clave-g").analizar("instr", "analizá", "QUJD");

        assertThat(r).startsWith("CREAR_TABLA: [Libro]");
        server.verify();
    }

    @Test
    void laClaveNuncaViajaEnLaUrl() {
        server.expect(request -> assertThat(request.getURI().toString()).doesNotContain("key="))
                .andRespond(withSuccess(OK, MediaType.APPLICATION_JSON));

        cliente("clave-g").analizar("i", "t", "QUJD");
        server.verify();
    }

    @Test
    void respuestaVaciaPasaAlSiguienteModelo() {
        server.expect(requestTo(BASE + "/models/m1:generateContent"))
                .andRespond(withSuccess("{\"candidates\":[]}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE + "/models/m2:generateContent"))
                .andRespond(withSuccess(OK, MediaType.APPLICATION_JSON));

        assertThat(cliente("k").analizar("i", "t", "QUJD")).contains("Libro");
    }

    @Test
    void todosLosModelosFallanLanzaIaNoDisponible() {
        server.expect(requestTo(BASE + "/models/m1:generateContent")).andRespond(withServerError());
        server.expect(requestTo(BASE + "/models/m2:generateContent")).andRespond(withTooManyRequests());

        assertThatThrownBy(() -> cliente("k").analizar("i", "t", "QUJD"))
                .isInstanceOf(IaNoDisponibleException.class)
                .hasMessage("No se pudo procesar la imagen con Gemini. Probá de nuevo en un momento.");
    }

    @Test
    void sinClaveNoLlamaYAvisaQueNoEstaConfigurado() {
        GeminiVisionClient c = cliente("  ");

        assertThat(c.tieneApiKey()).isFalse();
        assertThatThrownBy(() -> c.analizar("i", "t", "QUJD"))
                .isInstanceOf(IaNoDisponibleException.class)
                .hasMessage("El reconocimiento de imágenes no está configurado en el servidor");
        server.verify();
    }

    @Test
    void presupuestoAgotadoNoPruebaMasModelos() {
        GeminiVisionClient c = new GeminiVisionClient("k", List.of("m1", "m2"), restClient, -1);

        assertThatThrownBy(() -> c.analizar("i", "t", "QUJD")).isInstanceOf(IaNoDisponibleException.class);
        server.verify();
    }
}
