package com.casetool.backend.modules.chat.service;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import com.casetool.backend.core.websocket.StompAuthInterceptor;

/**
 * Traduce los eventos STOMP de Spring a altas/bajas de presencia. El SUBSCRIBE ya
 * pasó por StompAuthInterceptor (membresía verificada) cuando llega este evento.
 */
@Component
public class ChatPresenciaListener {

    private final ChatPresenciaService presenciaService;

    public ChatPresenciaListener(ChatPresenciaService presenciaService) {
        this.presenciaService = presenciaService;
    }

    @EventListener
    public void alSuscribirse(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destino = accessor.getDestination();
        if (!ChatDestinos.esPresencia(destino)) {
            return;
        }
        Long proyectoId = ChatDestinos.proyectoDe(destino).orElseThrow();
        StompAuthInterceptor.usuarioDe(event.getUser()).ifPresent(u -> presenciaService.registrar(
                accessor.getSessionId(), accessor.getSubscriptionId(), proyectoId, u.getId(), u.getUsername()));
    }

    @EventListener
    public void alDesuscribirse(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        presenciaService.quitar(accessor.getSessionId(), accessor.getSubscriptionId());
    }

    @EventListener
    public void alDesconectarse(SessionDisconnectEvent event) {
        presenciaService.quitarSesion(event.getSessionId());
    }
}
