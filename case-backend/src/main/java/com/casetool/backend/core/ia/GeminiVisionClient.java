package com.casetool.backend.core.ia;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.casetool.backend.core.ia.dto.GeminiRequest;
import com.casetool.backend.core.ia.dto.GeminiResponse;

/**
 * Reconoce fotos de diagramas con Google Gemini. Prueba los modelos en orden (si uno falla, responde
 * no-2xx o vacío, pasa al siguiente) dentro de un presupuesto total. La clave viaja en el header
 * {@code x-goog-api-key}, nunca en la URL (no queda en logs de proxies).
 */
@Component
public class GeminiVisionClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiVisionClient.class);
    /** Si ya pasó este tiempo, no se intenta otro modelo (el peor caso total queda en ~75 s). */
    public static final long PRESUPUESTO_MS = 45_000;

    private final String apiKey;
    private final List<String> modelos;
    private final RestClient restClient;
    private final long presupuestoMs;

    @Autowired
    public GeminiVisionClient(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta}") String apiUrl,
            @Value("${gemini.models:gemini-3.5-flash-lite,gemini-3.5-flash,gemini-2.0-flash}") String modelos,
            @Value("${gemini.timeout-ms:30000}") long timeoutMs) {
        this(apiKey, Arrays.stream(modelos.split(",")).map(String::trim).filter(m -> !m.isEmpty()).toList(),
                construirRestClient(apiUrl, timeoutMs), PRESUPUESTO_MS);
    }

    GeminiVisionClient(String apiKey, List<String> modelos, RestClient restClient, long presupuestoMs) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.modelos = modelos;
        this.restClient = restClient;
        this.presupuestoMs = presupuestoMs;
    }

    public boolean tieneApiKey() {
        return !apiKey.isBlank();
    }

    /** Devuelve el texto del primer modelo que responda; si ninguno lo logra, {@link IaNoDisponibleException}. */
    public String analizar(String instruccion, String texto, String imagenBase64) {
        if (!tieneApiKey()) {
            throw new IaNoDisponibleException("El reconocimiento de imágenes no está configurado en el servidor");
        }
        GeminiRequest body = GeminiRequest.de(instruccion, texto, imagenBase64);
        long inicio = System.currentTimeMillis();
        for (String modelo : modelos) {
            if (System.currentTimeMillis() - inicio > presupuestoMs) {
                log.warn("Gemini agotó el presupuesto de {} ms antes de probar {}", presupuestoMs, modelo);
                break;
            }
            try {
                GeminiResponse r = restClient.post()
                        .uri("/models/{modelo}:generateContent", modelo)
                        .header("x-goog-api-key", apiKey)
                        .body(body)
                        .retrieve()
                        .body(GeminiResponse.class);
                String respuesta = r != null ? r.texto() : "";
                if (!respuesta.isBlank()) {
                    return respuesta;
                }
                log.warn("Gemini {} devolvió una respuesta vacía", modelo);
            } catch (Exception ex) {
                log.warn("Gemini {} falló: {}", modelo, ex.getMessage());
            }
        }
        throw new IaNoDisponibleException("No se pudo procesar la imagen con Gemini. Probá de nuevo en un momento.");
    }

    private static RestClient construirRestClient(String apiUrl, long timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));
        String base = apiUrl != null && !apiUrl.isBlank() ? apiUrl.trim() : "https://generativelanguage.googleapis.com/v1beta";
        return RestClient.builder()
                .baseUrl(base)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
