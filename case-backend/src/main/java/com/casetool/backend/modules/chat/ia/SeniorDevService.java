package com.casetool.backend.modules.chat.ia;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.chat.service.ChatDestinos;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

@Service
public class SeniorDevService {

    private static final Logger log = LoggerFactory.getLogger(SeniorDevService.class);

    private final ConcurrentHashMap<Long, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final ChatMensajeRepository chatRepo;
    private final ProyectoRepository proyectoRepo;
    private final SeniorDevContextBuilder contextBuilder;
    private final DeepSeekClient deepSeekClient;
    private final SimpMessagingTemplate messagingTemplate;

    public SeniorDevService(
            ChatMensajeRepository chatRepo,
            ProyectoRepository proyectoRepo,
            SeniorDevContextBuilder contextBuilder,
            DeepSeekClient deepSeekClient,
            SimpMessagingTemplate messagingTemplate) {
        this.chatRepo = chatRepo;
        this.proyectoRepo = proyectoRepo;
        this.contextBuilder = contextBuilder;
        this.deepSeekClient = deepSeekClient;
        this.messagingTemplate = messagingTemplate;
    }

    @Async
    public void procesarMencion(Long proyectoId, Long disparadorId, String contenido, Long usuarioId) {
        ReentrantLock lock = locks.computeIfAbsent(proyectoId, k -> new ReentrantLock());
        lock.lock();
        try {
            ejecutar(proyectoId, disparadorId, contenido);
        } finally {
            lock.unlock();
        }
    }

    private void ejecutar(Long proyectoId, Long disparadorId, String contenido) {
        messagingTemplate.convertAndSend(
                ChatDestinos.topicIa(proyectoId),
                new ChatIaEstadoEvent(proyectoId, ChatIaEstadoEvent.Estado.PENSANDO, "Senior Dev está pensando...", disparadorId)
        );

        ChatMensaje disparador = buscarDisparador(disparadorId);
        try {
            var mensajes = contextBuilder.construirMensajes(proyectoId, contenido);
            String respuestaTexto = deepSeekClient.solicitarRespuesta(mensajes);

            ChatMensaje iaMensaje = new ChatMensaje();
            iaMensaje.setProyecto(disparador != null ? disparador.getProyecto() : proyectoRepo.getReferenceById(proyectoId));
            iaMensaje.setUsuario(null);
            iaMensaje.setTipo(ChatMensaje.Tipo.IA);
            iaMensaje.setContenido(respuestaTexto);
            iaMensaje.setRespuestaA(disparador);
            chatRepo.saveAndFlush(iaMensaje);

            messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(proyectoId), ChatMensajeResponse.from(iaMensaje, null));
            messagingTemplate.convertAndSend(
                    ChatDestinos.topicIa(proyectoId),
                    new ChatIaEstadoEvent(proyectoId, ChatIaEstadoEvent.Estado.RESPONDIDO, null, disparadorId)
            );
        } catch (Exception ex) {
            log.error("Error al procesar consulta Senior Dev en proyecto {}: {}", proyectoId, ex.getMessage(), ex);
            manejarFallo(proyectoId, disparador, disparadorId, ex);
        }
    }

    private void manejarFallo(Long proyectoId, ChatMensaje disparador, Long disparadorId, Exception ex) {
        String motivo = desglosarMotivo(ex);
        String texto = "⚠️ @SeniorDev no está disponible en este momento (" + motivo + "). Por favor intenta más tarde.";
        try {
            ChatMensaje sistema = new ChatMensaje();
            sistema.setProyecto(disparador != null ? disparador.getProyecto() : proyectoRepo.getReferenceById(proyectoId));
            sistema.setUsuario(null);
            sistema.setTipo(ChatMensaje.Tipo.SISTEMA);
            sistema.setContenido(texto);
            sistema.setRespuestaA(disparador);
            chatRepo.saveAndFlush(sistema);

            messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(proyectoId), ChatMensajeResponse.from(sistema, null));
        } catch (Exception e) {
            log.error("No se pudo persistir el mensaje de sistema de error", e);
        }

        messagingTemplate.convertAndSend(
                ChatDestinos.topicIa(proyectoId),
                new ChatIaEstadoEvent(proyectoId, ChatIaEstadoEvent.Estado.ERROR, motivo, disparadorId)
        );
    }

    private ChatMensaje buscarDisparador(Long disparadorId) {
        if (disparadorId == null) return null;
        for (int i = 0; i < 5; i++) {
            var opt = chatRepo.findById(disparadorId);
            if (opt.isPresent()) return opt.get();
            try {
                Thread.sleep(50);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
        return null;
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
