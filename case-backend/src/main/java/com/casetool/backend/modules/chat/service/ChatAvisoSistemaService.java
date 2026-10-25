package com.casetool.backend.modules.chat.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

/**
 * Guarda un aviso {@code SISTEMA} (sin autor) en la sala y lo difunde con el mismo evento que un mensaje
 * normal: la difusión la hace {@link ChatMensajeBroadcastListener} al confirmar esta transacción.
 * REQUIRES_NEW porque se llama desde un listener AFTER_COMMIT, donde la transacción original ya terminó.
 */
@Service
public class ChatAvisoSistemaService {

    private final ChatMensajeRepository chatRepo;
    private final ProyectoRepository proyectoRepo;
    private final ApplicationEventPublisher eventPublisher;

    public ChatAvisoSistemaService(ChatMensajeRepository chatRepo, ProyectoRepository proyectoRepo,
            ApplicationEventPublisher eventPublisher) {
        this.chatRepo = chatRepo;
        this.proyectoRepo = proyectoRepo;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ChatMensajeResponse publicar(Long proyectoId, String texto) {
        ChatMensaje m = new ChatMensaje();
        m.setProyecto(proyectoRepo.getReferenceById(proyectoId));
        m.setUsuario(null);
        m.setTipo(ChatMensaje.Tipo.SISTEMA);
        m.setContenido(texto);
        chatRepo.saveAndFlush(m);
        ChatMensajeResponse resp = ChatMensajeResponse.from(m, null);
        eventPublisher.publishEvent(new ChatMensajePublicadoEvent(resp, false));
        return resp;
    }
}
