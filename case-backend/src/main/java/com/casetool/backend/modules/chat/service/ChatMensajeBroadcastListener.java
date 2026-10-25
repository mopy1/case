package com.casetool.backend.modules.chat.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.casetool.backend.modules.chat.ia.SeniorDevService;

/**
 * Difunde el mensaje y dispara a Senior Dev SOLO cuando la transacción ya hizo commit: así nadie
 * recibe por WS un mensaje que después se revierte, y la IA siempre encuentra el disparador en BD.
 */
@Component
public class ChatMensajeBroadcastListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final SeniorDevService seniorDevService;

    public ChatMensajeBroadcastListener(SimpMessagingTemplate messagingTemplate, SeniorDevService seniorDevService) {
        this.messagingTemplate = messagingTemplate;
        this.seniorDevService = seniorDevService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alConfirmar(ChatMensajePublicadoEvent evento) {
        messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(evento.mensaje().proyectoId()), evento.mensaje());
        if (evento.mencionaIa()) {
            seniorDevService.procesarMencion(evento.mensaje());
        }
    }
}
