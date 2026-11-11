package com.casetool.backend.core.ia.motor;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.casetool.backend.core.ia.dto.DeepSeekChatRequest;
import com.casetool.backend.core.ia.dto.DeepSeekChatResponse;

/**
 * Cliente de llama-server (API compatible con OpenAI) que corre Qwen 3.5 MoE en Kaggle detrás de ngrok.
 * La URL base llega en cada llamada (cambia en cada sesión) y ya viene validada por {@link MotorIaUrlValidator}.
 * El HttpClient del JDK no sigue redirecciones: un túnel no puede mandarnos a otra máquina.
 */
@Component
public class KaggleLlamaClient {

    /** Resultado de probar el túnel: modelos que sirve llama-server y cuánto tardó. */
    public record Prueba(List<String> modelos, long latenciaMs) {}

    public record ModelosResponse(List<Modelo> data) {}

    public record Modelo(String id) {}

    private final String model;
    private final int maxTokensMin;
    private final RestClient restClient;

    public KaggleLlamaClient(
            @Value("${ia.kaggle.model:qwen3.5-35b-a3b}") String model,
            @Value("${ia.kaggle.max-tokens-min:4096}") int maxTokensMin,
            @Value("${ia.kaggle.timeout-ms:80000}") long timeoutMs) {
        this.model = model;
        this.maxTokensMin = maxTokensMin;
        this.restClient = construirRestClient(timeoutMs);
    }

    /** POST {url}/chat/completions con el modelo de Kaggle y al menos {@code max-tokens-min} (el razonamiento consume tokens). */
    public DeepSeekChatResponse completar(String url, DeepSeekChatRequest pedido) {
        int maxTokens = Math.max(pedido.max_tokens() != null ? pedido.max_tokens() : 0, maxTokensMin);
        DeepSeekChatRequest request = new DeepSeekChatRequest(model, pedido.messages(), pedido.temperature(),
                maxTokens, pedido.tools(), pedido.tool_choice());
        return restClient.post().uri(url + "/chat/completions").body(request).retrieve().body(DeepSeekChatResponse.class);
    }

    /** GET {url}/models: ids de los modelos cargados y la latencia en ms. */
    public Prueba probar(String url) {
        long inicio = System.currentTimeMillis();
        ModelosResponse r = restClient.get().uri(url + "/models").retrieve().body(ModelosResponse.class);
        List<String> ids = r != null && r.data() != null
                ? r.data().stream().map(Modelo::id).filter(Objects::nonNull).toList()
                : List.of();
        return new Prueba(ids, System.currentTimeMillis() - inicio);
    }

    private static RestClient construirRestClient(long timeoutMs) {
        HttpClient http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.min(timeoutMs, 15_000)))
                .followRedirects(HttpClient.Redirect.NEVER)
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));
        return RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("ngrok-skip-browser-warning", "true")
                .build();
    }
}
