package com.casetool.backend.modules.chat.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.MiembroAgregadoEvent;

/**
 * Cuando el alta de un miembro ya hizo commit, anuncia en la sala del equipo que se unió y le indica
 * dónde está la Guía. Si el aviso falla solo se loguea: el alta del miembro nunca se revierte.
 */
@Component
public class ChatMiembroAgregadoListener {

    private static final Logger log = LoggerFactory.getLogger(ChatMiembroAgregadoListener.class);

    private final ChatAvisoSistemaService avisoService;

    public ChatMiembroAgregadoListener(ChatAvisoSistemaService avisoService) {
        this.avisoService = avisoService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alAgregarMiembro(MiembroAgregadoEvent evento) {
        try {
            avisoService.publicar(evento.proyectoId(), texto(evento));
        } catch (Exception ex) {
            log.warn("No se pudo publicar el aviso de nuevo miembro en proyecto {}: {}", evento.proyectoId(), ex.getMessage());
        }
    }

    static String texto(MiembroAgregadoEvent evento) {
        return "@" + evento.username() + " se unió al proyecto como " + rolLegible(evento.rol())
                + ". Para arrancar, abrí la Guía del Copilot › Primeros pasos.";
    }

    static String rolLegible(MiembroProyecto.Rol rol) {
        return switch (rol) {
            case ADMIN -> "Administrador";
            case COLABORADOR -> "Colaborador";
            case LECTOR -> "Lector";
        };
    }
}
