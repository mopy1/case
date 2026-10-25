package com.casetool.backend.modules.chat.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Limit;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.chat.dto.ChatMensajeRequest;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@Service
@Transactional
public class ChatMensajeService {

    static final int LIMITE_DEFAULT = 30;
    static final int LIMITE_MAX = 100;

    private final ChatMensajeRepository chatMensajeRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MiembroProyectoRepository miembroProyectoRepository;
    private final ProyectoAccesoService accesoService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMensajeService(
            ChatMensajeRepository chatMensajeRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MiembroProyectoRepository miembroProyectoRepository,
            ProyectoAccesoService accesoService,
            SimpMessagingTemplate messagingTemplate) {
        this.chatMensajeRepository = chatMensajeRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.miembroProyectoRepository = miembroProyectoRepository;
        this.accesoService = accesoService;
        this.messagingTemplate = messagingTemplate;
    }

    /** Página de historial en orden cronológico ascendente (el más viejo primero). */
    @Transactional(readOnly = true)
    public List<ChatMensajeResponse> listar(Long proyectoId, Long antesDe, Integer limite, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        Limit limit = Limit.of(recortarLimite(limite));
        List<ChatMensaje> recientes = antesDe == null
                ? chatMensajeRepository.findByProyectoIdOrderByCreatedAtDescIdDesc(proyectoId, limit)
                : chatMensajeRepository.findByProyectoIdAndIdLessThanOrderByCreatedAtDescIdDesc(proyectoId, antesDe, limit);

        List<ChatMensaje> ascendente = new ArrayList<>(recientes);
        Collections.reverse(ascendente);
        Map<Long, MiembroProyecto.Rol> roles = rolesDelProyecto(proyectoId);
        return ascendente.stream()
                .map(m -> ChatMensajeResponse.from(m, m.getUsuario() == null ? null : roles.get(m.getUsuario().getId())))
                .toList();
    }

    /** Cualquier miembro (también LECTOR, decisión D1) escribe; se guarda y después se difunde. */
    public ChatMensajeResponse enviar(Long proyectoId, ChatMensajeRequest request, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        String contenido = request.contenido() == null ? "" : request.contenido().strip();
        if (contenido.isEmpty()) {
            throw new IllegalArgumentException("El mensaje no puede estar vacío");
        }

        ChatMensaje mensaje = new ChatMensaje();
        mensaje.setProyecto(proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado")));
        mensaje.setUsuario(usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado")));
        mensaje.setTipo(ChatMensaje.Tipo.USUARIO);
        mensaje.setContenido(contenido);
        chatMensajeRepository.saveAndFlush(mensaje);

        ChatMensajeResponse response = ChatMensajeResponse.from(mensaje, miembro.getRol());
        messagingTemplate.convertAndSend(ChatDestinos.topicMensajes(proyectoId), response);
        return response;
    }

    /** Default 30; fuera de [1, 100] se recorta en vez de dar error. */
    static int recortarLimite(Integer limite) {
        if (limite == null) {
            return LIMITE_DEFAULT;
        }
        return Math.max(1, Math.min(LIMITE_MAX, limite));
    }

    /** Una sola consulta de miembros → rol actual de cada autor (sin N+1). */
    private Map<Long, MiembroProyecto.Rol> rolesDelProyecto(Long proyectoId) {
        return miembroProyectoRepository.findByProyectoId(proyectoId).stream()
                .collect(Collectors.toMap(mp -> mp.getUsuario().getId(), MiembroProyecto::getRol));
    }
}
