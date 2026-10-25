package com.casetool.backend.modules.chat.ia;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.chat.ia.dto.DeepSeekChatRequest.Mensaje;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

@Component
@Transactional(readOnly = true)
public class SeniorDevContextBuilder {

    private final ProyectoRepository proyectoRepo;
    private final MiembroProyectoRepository miembroRepo;
    private final ChatMensajeRepository chatRepo;
    private final SeniorDevProyectoFormatter proyectoFormatter;

    public SeniorDevContextBuilder(
            ProyectoRepository proyectoRepo,
            MiembroProyectoRepository miembroRepo,
            ChatMensajeRepository chatRepo,
            SeniorDevProyectoFormatter proyectoFormatter) {
        this.proyectoRepo = proyectoRepo;
        this.miembroRepo = miembroRepo;
        this.chatRepo = chatRepo;
        this.proyectoFormatter = proyectoFormatter;
    }

    public List<Mensaje> construirMensajes(Long proyectoId, String consultaActual) {
        StringBuilder userContent = new StringBuilder();
        userContent.append("=== ESTADO DEL PROYECTO ===\n")
                .append(formatearEstadoProyecto(proyectoId)).append("\n\n")
                .append("=== HISTORIAL DE LA SALA (ÚLTIMOS MENSAJES) ===\n")
                .append(formatearHistorial(proyectoId));

        if (consultaActual != null && !consultaActual.isBlank()) {
            userContent.append("\n\n=== CONSULTA ACTUAL ===\n").append(consultaActual.trim());
        }

        return List.of(
                new Mensaje("system", SeniorDevPrompts.SYSTEM_PROMPT),
                new Mensaje("user", userContent.toString())
        );
    }

    private String formatearEstadoProyecto(Long proyectoId) {
        Proyecto p = proyectoRepo.findById(proyectoId).orElse(null);
        StringBuilder sb = new StringBuilder();
        sb.append("Proyecto: ").append(p != null ? p.getNombre() : "Proyecto").append("\n");
        sb.append("Descripción: ").append(p != null && p.getDescripcion() != null ? p.getDescripcion() : "Sin descripción").append("\n");

        sb.append("Miembros del Equipo:\n");
        List<MiembroProyecto> miembros = miembroRepo.findByProyectoId(proyectoId);
        if (miembros.isEmpty()) sb.append("- (Sin miembros registrados)\n");
        for (MiembroProyecto m : miembros) {
            sb.append("- @").append(m.getUsuario().getUsername()).append(" (").append(m.getRol()).append(")\n");
        }

        proyectoFormatter.agregarSeccionesLienzoYGestion(proyectoId, sb);
        return sb.toString().trim();
    }

    private String formatearHistorial(Long proyectoId) {
        Map<Long, MiembroProyecto.Rol> roles = miembroRepo.findByProyectoId(proyectoId).stream()
                .collect(Collectors.toMap(mp -> mp.getUsuario().getId(), MiembroProyecto::getRol));
        List<ChatMensaje> recientes = chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(proyectoId, Limit.of(30));
        List<ChatMensaje> ascendente = new ArrayList<>(recientes);
        Collections.reverse(ascendente);
        if (ascendente.isEmpty()) return "(No hay mensajes previos en la sala)";

        StringBuilder sb = new StringBuilder();
        for (ChatMensaje m : ascendente) {
            if (m.getTipo() == ChatMensaje.Tipo.IA) {
                sb.append("[Senior Dev · IA]: ").append(m.getContenido()).append("\n");
            } else if (m.getTipo() == ChatMensaje.Tipo.SISTEMA) {
                sb.append("[Sistema]: ").append(m.getContenido()).append("\n");
            } else {
                String user = m.getUsuario() != null ? m.getUsuario().getUsername() : "usuario";
                MiembroProyecto.Rol rol = m.getUsuario() != null ? roles.get(m.getUsuario().getId()) : null;
                String rolStr = rol != null ? rol.name() : "MIEMBRO";
                sb.append("[").append(user).append(" · ").append(rolStr).append("]: ").append(m.getContenido()).append("\n");
            }
        }
        return sb.toString().trim();
    }
}
