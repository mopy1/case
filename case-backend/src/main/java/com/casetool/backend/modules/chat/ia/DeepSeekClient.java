package com.casetool.backend.modules.chat.ia;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.casetool.backend.modules.chat.ia.dto.DeepSeekChatRequest;
import com.casetool.backend.modules.chat.ia.dto.DeepSeekChatResponse;

@Component
public class DeepSeekClient {

    private final String apiKey;
    private final String model;
    private final RestClient restClient;

    @Autowired
    public DeepSeekClient(
            @Value("${deepseek.api.key:}") String apiKey,
            @Value("${deepseek.api.url:https://api.deepseek.com}") String apiUrl,
            @Value("${deepseek.model:deepseek-chat}") String model,
            @Value("${deepseek.timeout-ms:60000}") long timeoutMs) {
        this(apiKey, model, construirRestClient(apiUrl, timeoutMs));
    }

    DeepSeekClient(String apiKey, String model, RestClient restClient) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null && !model.isBlank() ? model.trim() : "deepseek-chat";
        this.restClient = restClient;
    }

    public boolean tieneApiKey() {
        return !apiKey.isBlank();
    }

    public String solicitarRespuesta(List<DeepSeekChatRequest.Mensaje> mensajes) {
        if (!tieneApiKey()) {
            throw new IllegalStateException("Clave de API de DeepSeek no configurada");
        }

        DeepSeekChatRequest request = new DeepSeekChatRequest(model, mensajes, 0.7, 1024);

        DeepSeekChatResponse response = restClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .body(request)
                .retrieve()
                .body(DeepSeekChatResponse.class);

        if (response == null || response.contenido().isBlank()) {
            throw new IllegalStateException("Respuesta vacía del proveedor de IA");
        }

        return response.contenido();
    }

    private static RestClient construirRestClient(String apiUrl, long timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));

        String base = (apiUrl != null && !apiUrl.isBlank()) ? apiUrl.trim() : "https://api.deepseek.com";
        return RestClient.builder()
                .baseUrl(base)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
