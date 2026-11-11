package com.casetool.backend.modules.chat.ia;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.IaErrores;
import com.casetool.backend.core.ia.motor.MotorIaContexto;
import com.casetool.backend.core.ia.motor.MotorIaPreferencias;
import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent.Estado;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;

/**
 * Orquesta una mención a @SeniorDev (en background, una a la vez por proyecto): contexto → bucle
 * con herramientas → mensaje IA en el hilo → actualización de la memoria acumulada.
 * La respuesta usa el motor que eligió quien mencionó (Qwen en Kaggle o DeepSeek); el resumidor
 * corre fuera de ese contexto, siempre con DeepSeek (mantenimiento en segundo plano, no debe sumar latencia).
 */
@Service
public class SeniorDevService {

    private static final Logger log = LoggerFactory.getLogger(SeniorDevService.class);

    private final ConcurrentHashMap<Long, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final ChatMensajeRepository chatRepo;
    private final SeniorDevContextBuilder contextBuilder;
    private final SeniorDevConversacion conversacion;
    private final SeniorDevResumidor resumidor;
    private final DeepSeekClient deepSeekClient;
    private final SeniorDevPublicador publicador;
    private final MotorIaPreferencias motorPreferencias;

    public SeniorDevService(ChatMensajeRepository chatRepo, SeniorDevContextBuilder contextBuilder,
            SeniorDevConversacion conversacion, SeniorDevResumidor resumidor, DeepSeekClient deepSeekClient,
            SeniorDevPublicador publicador, MotorIaPreferencias motorPreferencias) {
        this.chatRepo = chatRepo;
        this.contextBuilder = contextBuilder;
        this.conversacion = conversacion;
        this.resumidor = resumidor;
        this.deepSeekClient = deepSeekClient;
        this.publicador = publicador;
        this.motorPreferencias = motorPreferencias;
    }

    /** Lo llama el listener AFTER_COMMIT: el disparador ya está en BD (sin reintentos). */
    @Async
    public void procesarMencion(ChatMensajeResponse disparador) {
        ReentrantLock lock = locks.computeIfAbsent(disparador.proyectoId(), k -> new ReentrantLock());
        lock.lock();
        try {
            ejecutar(disparador);
        } finally {
            lock.unlock();
        }
    }

    private void ejecutar(ChatMensajeResponse d) {
        String urlKaggle = motorPreferencias.urlKaggle(d.usuarioId()).orElse(null);
        if (MotorIaContexto.ejecutarCon(urlKaggle, () -> responder(d))) {
            actualizarMemoria(d.proyectoId());
        }
    }

    /** true si respondió; ante un error deja un mensaje SISTEMA en el hilo y devuelve false. */
    private boolean responder(ChatMensajeResponse d) {
        Long proyectoId = d.proyectoId();
        publicador.estado(proyectoId, Estado.PENSANDO, "Senior Dev está pensando...", d.id());
        ChatMensaje disparador = chatRepo.findById(d.id()).orElse(null);
        try {
            var contexto = contextBuilder.construirMensajes(d);
            var respuesta = conversacion.responder(contexto, proyectoId, d.usuarioId(),
                    detalle -> publicador.estado(proyectoId, Estado.PENSANDO, detalle, d.id()));
            publicador.respuesta(proyectoId, disparador, respuesta);
            publicador.estado(proyectoId, Estado.RESPONDIDO, null, d.id());
            return true;
        } catch (Exception ex) {
            log.error("Error al procesar consulta Senior Dev en proyecto {}: {}", proyectoId, ex.getMessage(), ex);
            manejarFallo(proyectoId, disparador, d.id(), ex);
            return false;
        }
    }

    /** Después de responder (decisión D3): un fallo acá nunca afecta la respuesta ya enviada. */
    private void actualizarMemoria(Long proyectoId) {
        try {
            resumidor.actualizarSiCorresponde(proyectoId);
        } catch (Exception ex) {
            log.warn("Fallo del resumidor en proyecto {}: {}", proyectoId, ex.getMessage());
        }
    }

    private void manejarFallo(Long proyectoId, ChatMensaje disparador, Long disparadorId, Exception ex) {
        String motivo = deepSeekClient.tieneApiKey() ? IaErrores.motivo(ex) : "Clave de API no configurada";
        try {
            publicador.sistema(proyectoId, disparador,
                    "@SeniorDev no está disponible en este momento (" + motivo + "). Por favor intenta más tarde.");
        } catch (Exception e) {
            log.error("No se pudo persistir el mensaje de sistema de error", e);
        }
        publicador.estado(proyectoId, Estado.ERROR, motivo, disparadorId);
    }
}
