package com.casetool.backend.core.ia.motor;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Motor elegido por cada usuario, en memoria: solo se guarda la URL de Kaggle (sin entrada = DeepSeek).
 * Se pierde al reiniciar el backend; el frontend la vuelve a sincronizar al cargar.
 */
@Component
public class MotorIaPreferencias {

    private final ConcurrentHashMap<Long, String> urlsKaggle = new ConcurrentHashMap<>();
    private final MotorIaUrlValidator validator;

    public MotorIaPreferencias(MotorIaUrlValidator validator) {
        this.validator = validator;
    }

    /** DEEPSEEK borra la preferencia; QWEN_KAGGLE exige una URL válida. Devuelve la URL normalizada (o null). */
    public String guardar(Long usuarioId, MotorIa motor, String urlKaggle) {
        if (motor != MotorIa.QWEN_KAGGLE) {
            urlsKaggle.remove(usuarioId);
            return null;
        }
        String normalizada = validator.normalizar(urlKaggle);
        urlsKaggle.put(usuarioId, normalizada);
        return normalizada;
    }

    public Optional<String> urlKaggle(Long usuarioId) {
        return usuarioId == null ? Optional.empty() : Optional.ofNullable(urlsKaggle.get(usuarioId));
    }
}
