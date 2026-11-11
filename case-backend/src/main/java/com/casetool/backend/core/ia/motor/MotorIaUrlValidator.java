package com.casetool.backend.core.ia.motor;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Anti-SSRF: el backend solo llama a URLs https de un túnel ngrok (subdominio de un host permitido),
 * sin credenciales ni puerto raro, para que nadie lo use de proxy hacia la red interna.
 * Normaliza a {@code https://host/.../v1} (sin "/" final).
 */
@Component
public class MotorIaUrlValidator {

    private static final int MAX_CHARS = 300;

    private final List<String> hostsPermitidos;

    public MotorIaUrlValidator(
            @Value("${ia.kaggle.hosts-permitidos:ngrok-free.dev,ngrok-free.app,ngrok.app,ngrok.dev,ngrok.io}") String hosts) {
        this.hostsPermitidos = Arrays.stream(hosts.split(","))
                .map(h -> h.trim().toLowerCase(Locale.ROOT)).filter(h -> !h.isEmpty()).toList();
    }

    /** Devuelve la URL normalizada o lanza {@link IllegalArgumentException} (400 por el handler global). */
    public String normalizar(String url) {
        if (url == null || url.isBlank() || url.strip().length() > MAX_CHARS) {
            throw invalida("Ingresá la URL del túnel de Kaggle");
        }
        URI uri = parsear(url.strip());
        if (!"https".equalsIgnoreCase(uri.getScheme())) throw invalida("La URL de Kaggle debe usar https");
        if (uri.getRawUserInfo() != null || uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw invalida("La URL de Kaggle no puede llevar credenciales, parámetros ni fragmentos");
        }
        if (uri.getPort() != -1 && uri.getPort() != 443) throw invalida("La URL de Kaggle no puede usar otro puerto");
        String host = uri.getHost() != null ? uri.getHost().toLowerCase(Locale.ROOT) : "";
        if (hostsPermitidos.stream().noneMatch(p -> host.endsWith("." + p))) {
            throw invalida("La URL de Kaggle debe ser un túnel de ngrok (ej. https://xxxx.ngrok-free.dev/v1)");
        }
        return "https://" + host + ruta(uri.getRawPath());
    }

    /** Quita las "/" finales y asegura que termine en /v1. */
    private static String ruta(String path) {
        String p = path == null ? "" : path.replaceAll("/+$", "");
        return p.endsWith("/v1") ? p : p + "/v1";
    }

    private static URI parsear(String url) {
        try {
            return new URI(url);
        } catch (URISyntaxException ex) {
            throw invalida("La URL de Kaggle no es válida");
        }
    }

    private static IllegalArgumentException invalida(String mensaje) {
        return new IllegalArgumentException(mensaje);
    }
}
