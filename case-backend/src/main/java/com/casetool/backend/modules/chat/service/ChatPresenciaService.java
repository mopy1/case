package com.casetool.backend.modules.chat.service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.casetool.backend.modules.chat.dto.ChatPresenciaResponse;
import com.casetool.backend.modules.chat.dto.ChatPresenciaResponse.UsuarioEnSala;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

/**
 * "Quién está en la sala" en memoria (como ColaboracionController): se pierde al
 * reiniciar y no escala a más de una instancia, aceptable para un EC2 único.
 * Clave = sessionId + ":" + subscriptionId de la suscripción a .../chat/presencia.
 */
@Service
public class ChatPresenciaService {

    record Entrada(Long proyectoId, Long usuarioId, String username) {
    }

    private final Map<String, Entrada> entradas = new ConcurrentHashMap<>();
    private final ProyectoAccesoService accesoService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatPresenciaService(ProyectoAccesoService accesoService, SimpMessagingTemplate messagingTemplate) {
        this.accesoService = accesoService;
        this.messagingTemplate = messagingTemplate;
    }

    public void registrar(String sessionId, String subscriptionId, Long proyectoId, Long usuarioId, String username) {
        entradas.put(clave(sessionId, subscriptionId), new Entrada(proyectoId, usuarioId, username));
        difundir(proyectoId);
    }

    public void quitar(String sessionId, String subscriptionId) {
        Entrada quitada = entradas.remove(clave(sessionId, subscriptionId));
        if (quitada != null) {
            difundir(quitada.proyectoId());
        }
    }

    /** Al cerrar la conexión (pestaña cerrada o corte detectado por heartbeat) salen todas sus suscripciones. */
    public void quitarSesion(String sessionId) {
        String prefijo = sessionId + ":";
        Set<Long> afectados = entradas.keySet().stream()
                .filter(k -> k.startsWith(prefijo))
                .map(entradas::remove)
                .filter(e -> e != null)
                .map(Entrada::proyectoId)
                .collect(Collectors.toSet());
        afectados.forEach(this::difundir);
    }

    /** Snapshot para el GET REST; solo miembros del proyecto. */
    public ChatPresenciaResponse obtener(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        return snapshot(proyectoId);
    }

    /** Una entrada por usuario (varias pestañas = 1), ordenado por username. */
    ChatPresenciaResponse snapshot(Long proyectoId) {
        Map<Long, UsuarioEnSala> unicos = new LinkedHashMap<>();
        entradas.values().stream()
                .filter(e -> e.proyectoId().equals(proyectoId))
                .forEach(e -> unicos.putIfAbsent(e.usuarioId(), new UsuarioEnSala(e.usuarioId(), e.username())));
        List<UsuarioEnSala> usuarios = unicos.values().stream()
                .sorted(Comparator.comparing(UsuarioEnSala::username, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new ChatPresenciaResponse(proyectoId, usuarios);
    }

    private void difundir(Long proyectoId) {
        messagingTemplate.convertAndSend(ChatDestinos.topicPresencia(proyectoId), snapshot(proyectoId));
    }

    private static String clave(String sessionId, String subscriptionId) {
        return sessionId + ":" + subscriptionId;
    }
}
