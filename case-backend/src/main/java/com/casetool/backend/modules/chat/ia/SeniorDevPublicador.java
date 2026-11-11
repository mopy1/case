package com.casetool.backend.modules.chat.ia;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent;
import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent.Estado;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.SeniorDevConversacion.RespuestaIa;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.chat.service.ChatDestinos;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

/** Lo que Senior Dev deja en la sala: el mensaje IA o SISTEMA en el hilo (BD + tópico) y los eventos de estado. */
@Component
public class SeniorDevPublicador {

    private final ChatMensajeRepository chatRepo;
    private final ProyectoRepository proyectoRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public SeniorDevPublicador(ChatMensajeRepository chatRepo, ProyectoRepository proyectoRepo,
            SimpMessagingTemplate messagingTemplate) {
        this.chatRepo = chatRepo;
        this.proyectoRepo = proyectoRepo;
        this.messagingTemplate = messagingTemplate;
    }

    /** Mensaje IA con las herramientas consultadas (CSV) y el razonamiento del modelo (si lo hubo). */
    public void respuesta(Long proyectoId, ChatMensaje disparador, RespuestaIa respuesta) {
        ChatMensaje ia = nuevo(proyectoId, disparador, ChatMensaje.Tipo.IA, respuesta.texto());
        ia.setHerramientasUsadas(respuesta.herramientas().isEmpty() ? null : String.join(",", respuesta.herramientas()));
        ia.setRazonamiento(respuesta.razonamiento());
        guardarYDifundir(proyectoId, ia);
    }

    public void sistema(Long proyectoId, ChatMensaje disparador, String texto) {
        guardarYDifundir(proyectoId, nuevo(proyectoId, disparador, ChatMensaje.Tipo.SISTEMA, texto));
    }

    public void estado(Long proyectoId, Estado estado, String detalle, Long disparadorId) {
        messagingTemplate.convertAndSend(ChatDestinos.topicIa(proyectoId),
                new ChatIaEstadoEvent(proyectoId, estado, detalle, disparadorId));
    }

    private void guardarYDifundir(Long proyectoId, ChatMensaje m) {
        chatRepo.saveAndFlush(m);
        messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(proyectoId), ChatMensajeResponse.from(m, null));
    }

    private ChatMensaje nuevo(Long proyectoId, ChatMensaje disparador, ChatMensaje.Tipo tipo, String contenido) {
        ChatMensaje m = new ChatMensaje();
        m.setProyecto(disparador != null ? disparador.getProyecto() : proyectoRepo.getReferenceById(proyectoId));
        m.setUsuario(null);
        m.setTipo(tipo);
        m.setContenido(contenido);
        m.setRespuestaA(disparador);
        return m;
    }
}
