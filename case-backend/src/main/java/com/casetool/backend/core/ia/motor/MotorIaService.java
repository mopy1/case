package com.casetool.backend.core.ia.motor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.casetool.backend.core.ia.IaErrores;
import com.casetool.backend.core.ia.motor.dto.MotorIaProbarResponse;
import com.casetool.backend.core.ia.motor.dto.MotorIaRequest;
import com.casetool.backend.core.ia.motor.dto.MotorIaResponse;

/** Lee, guarda y prueba el motor de IA de cada usuario (la URL siempre pasa por el validador anti-SSRF). */
@Service
public class MotorIaService {

    private static final Logger log = LoggerFactory.getLogger(MotorIaService.class);

    private final MotorIaPreferencias preferencias;
    private final MotorIaUrlValidator validator;
    private final KaggleLlamaClient kaggle;

    public MotorIaService(MotorIaPreferencias preferencias, MotorIaUrlValidator validator, KaggleLlamaClient kaggle) {
        this.preferencias = preferencias;
        this.validator = validator;
        this.kaggle = kaggle;
    }

    public MotorIaResponse obtener(Long usuarioId) {
        String url = preferencias.urlKaggle(usuarioId).orElse(null);
        return new MotorIaResponse(url != null ? MotorIa.QWEN_KAGGLE : MotorIa.DEEPSEEK, url);
    }

    public MotorIaResponse guardar(Long usuarioId, MotorIaRequest req) {
        String url = preferencias.guardar(usuarioId, req.motor(), req.urlKaggle());
        return new MotorIaResponse(req.motor(), url);
    }

    /** URL inválida → 400 (IllegalArgumentException); Kaggle caído → ok=false con el motivo. */
    public MotorIaProbarResponse probar(String url) {
        String normalizada = validator.normalizar(url);
        try {
            KaggleLlamaClient.Prueba prueba = kaggle.probar(normalizada);
            return MotorIaProbarResponse.exito(prueba.modelos(), prueba.latenciaMs());
        } catch (Exception ex) {
            log.warn("Prueba de Kaggle fallida: {}", ex.getMessage());
            return MotorIaProbarResponse.fallo(IaErrores.motivo(ex));
        }
    }
}
