package com.casetool.backend.modules.chat.ia;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent;
import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent.Estado;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.chat.service.ChatDestinos;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

/**
 * Orquesta una mención a @SeniorDev (en background, una a la vez por proyecto): contexto → bucle
 * con herramientas → mensaje IA en el hilo → actualización de la memoria acumulada.
 */
@Service
public class SeniorDevService {

    private static final Logger log = LoggerFactory.getLogger(SeniorDevService.class);

    private final ConcurrentHashMap<Long, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final ChatMensajeRepository chatRepo;
    private final ProyectoRepository proyectoRepo;
    private final SeniorDevContextBuilder contextBuilder;
    private final SeniorDevConversacion conversacion;
    private final SeniorDevResumidor resumidor;
    private final DeepSeekClient deepSeekClient;
    private final SimpMessagingTemplate messagingTemplate;

    public SeniorDevService(ChatMensajeRepository chatRepo, ProyectoRepository proyectoRepo,
            SeniorDevContextBuilder contextBuilder, SeniorDevConversacion conversacion, SeniorDevResumidor resumidor,
            DeepSeekClient deepSeekClient, SimpMessagingTemplate messagingTemplate) {
        this.chatRepo = chatRepo;
        this.proyectoRepo = proyectoRepo;
        this.contextBuilder = contextBuilder;
        this.conversacion = conversacion;
        this.resumidor = resumidor;
        this.deepSeekClient = deepSeekClient;
        this.messagingTemplate = messagingTemplate;
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
        Long proyectoId = d.proyectoId();
        emitir(proyectoId, Estado.PENSANDO, "Senior Dev está pensando...", d.id());
        ChatMensaje disparador = chatRepo.findById(d.id()).orElse(null);
        try {
            var contexto = contextBuilder.construirMensajes(d);
            var respuesta = conversacion.responder(contexto, proyectoId, d.usuarioId(),
                    detalle -> emitir(proyectoId, Estado.PENSANDO, detalle, d.id()));
            ChatMensaje ia = nuevoMensaje(proyectoId, disparador, ChatMensaje.Tipo.IA, respuesta.texto());
            ia.setHerramientasUsadas(respuesta.herramientas().isEmpty() ? null : String.join(",", respuesta.herramientas()));
            chatRepo.saveAndFlush(ia);
            messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(proyectoId), ChatMensajeResponse.from(ia, null));
            emitir(proyectoId, Estado.RESPONDIDO, null, d.id());
        } catch (Exception ex) {
            log.error("Error al procesar consulta Senior Dev en proyecto {}: {}", proyectoId, ex.getMessage(), ex);
            manejarFallo(proyectoId, disparador, d.id(), ex);
            return;
        }
        actualizarMemoria(proyectoId);
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
        String motivo = desglosarMotivo(ex);
        String texto = "@SeniorDev no está disponible en este momento (" + motivo + "). Por favor intenta más tarde.";
        try {
            ChatMensaje sistema = nuevoMensaje(proyectoId, disparador, ChatMensaje.Tipo.SISTEMA, texto);
            chatRepo.saveAndFlush(sistema);
            messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(proyectoId), ChatMensajeResponse.from(sistema, null));
        } catch (Exception e) {
            log.error("No se pudo persistir el mensaje de sistema de error", e);
        }
        emitir(proyectoId, Estado.ERROR, motivo, disparadorId);
    }

    private ChatMensaje nuevoMensaje(Long proyectoId, ChatMensaje disparador, ChatMensaje.Tipo tipo, String contenido) {
        ChatMensaje m = new ChatMensaje();
        m.setProyecto(disparador != null ? disparador.getProyecto() : proyectoRepo.getReferenceById(proyectoId));
        m.setUsuario(null);
        m.setTipo(tipo);
        m.setContenido(contenido);
        m.setRespuestaA(disparador);
        return m;
    }

    private void emitir(Long proyectoId, Estado estado, String detalle, Long disparadorId) {
        messagingTemplate.convertAndSend(ChatDestinos.topicIa(proyectoId),
                new ChatIaEstadoEvent(proyectoId, estado, detalle, disparadorId));
    }

    private String desglosarMotivo(Exception ex) {
        if (!deepSeekClient.tieneApiKey()) return "Clave de API no configurada";
        String msg = ex.getMessage() != null ? ex.getMessage() : "";
        if (msg.toLowerCase().contains("timeout") || msg.toLowerCase().contains("timed out")) return "Tiempo de espera agotado";
        if (msg.contains("401") || msg.toLowerCase().contains("unauthorized")) return "Error de autenticación con el proveedor";
        if (msg.contains("429")) return "Límite de solicitudes excedido";
        return msg.isBlank() ? "Error del proveedor de IA" : msg;
    }
}
