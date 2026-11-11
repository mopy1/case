package com.casetool.backend.core.ia.motor;

import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.casetool.backend.core.ia.IaErrores;
import com.casetool.backend.core.ia.dto.DeepSeekChatRequest;
import com.casetool.backend.core.ia.dto.DeepSeekChatResponse;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;

/**
 * Decide quién responde una llamada: si el pedido tiene Kaggle en {@link MotorIaContexto} lo intenta primero;
 * ante cualquier error o respuesta vacía cae a DeepSeek sin que el usuario vea un error (si no hay clave de
 * DeepSeek, relanza el error de Kaggle). Marca el motor que efectivamente respondió.
 */
@Component
public class MotorIaRouter {

    private static final Logger log = LoggerFactory.getLogger(MotorIaRouter.class);

    private final KaggleLlamaClient kaggle;

    public MotorIaRouter(KaggleLlamaClient kaggle) {
        this.kaggle = kaggle;
    }

    public DeepSeekMensaje completar(DeepSeekChatRequest request, boolean hayClaveDeepSeek, Supplier<DeepSeekMensaje> deepSeek) {
        String url = MotorIaContexto.urlKaggle();
        if (url != null) {
            try {
                return conKaggle(url, request);
            } catch (RuntimeException ex) {
                if (!hayClaveDeepSeek) throw ex;
                log.warn("Qwen en Kaggle no respondió ({}), sigo con DeepSeek", IaErrores.motivo(ex));
                MotorIaContexto.descartarKaggle();
            }
        }
        DeepSeekMensaje mensaje = deepSeek.get();
        MotorIaContexto.marcarUsado(MotorIa.DEEPSEEK);
        return mensaje;
    }

    private DeepSeekMensaje conKaggle(String url, DeepSeekChatRequest request) {
        DeepSeekChatResponse response = kaggle.completar(url, request);
        DeepSeekMensaje mensaje = RazonamientoExtractor.normalizar(response != null ? response.mensaje() : null);
        if (mensaje == null || mensaje.estaVacio()) {
            throw new IllegalStateException("Respuesta vacía de Qwen en Kaggle");
        }
        MotorIaContexto.marcarUsado(MotorIa.QWEN_KAGGLE);
        return mensaje;
    }
}
