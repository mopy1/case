package com.casetool.backend.modules.chat.ia;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.dto.DeepSeekMensaje;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMemoriaRepository;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

/**
 * Arma el prompt: {@code system} fijo + un {@code user} con 4 secciones, de lo estable a lo volátil:
 * memoria acumulada, estado del proyecto, historial reciente (sin el disparador) y la consulta con autor.
 */
@Component
@Transactional(readOnly = true)
public class SeniorDevContextBuilder {

    private final ProyectoRepository proyectoRepo;
    private final MiembroProyectoRepository miembroRepo;
    private final ChatMensajeRepository chatRepo;
    private final ChatMemoriaRepository memoriaRepo;
    private final SeniorDevProyectoFormatter proyectoFormatter;

    public SeniorDevContextBuilder(
            ProyectoRepository proyectoRepo,
            MiembroProyectoRepository miembroRepo,
            ChatMensajeRepository chatRepo,
            ChatMemoriaRepository memoriaRepo,
            SeniorDevProyectoFormatter proyectoFormatter) {
        this.proyectoRepo = proyectoRepo;
        this.miembroRepo = miembroRepo;
        this.chatRepo = chatRepo;
        this.memoriaRepo = memoriaRepo;
        this.proyectoFormatter = proyectoFormatter;
    }

    public List<DeepSeekMensaje> construirMensajes(ChatMensajeResponse disparador) {
        Long proyectoId = disparador.proyectoId();
        List<MiembroProyecto> miembros = miembroRepo.findByProyectoId(proyectoId);
        String user = seccionMemoria(proyectoId) + "\n\n"
                + "=== ESTADO DEL PROYECTO ===\n" + estadoProyecto(proyectoId, miembros) + "\n\n"
                + seccionHistorial(proyectoId, disparador.id(), miembros) + "\n\n"
                + seccionConsulta(disparador);
        return List.of(DeepSeekMensaje.system(SeniorDevPrompts.SYSTEM_PROMPT), DeepSeekMensaje.user(user));
    }

    private String seccionMemoria(Long proyectoId) {
        return memoriaRepo.findById(proyectoId)
                .map(m -> "=== MEMORIA DEL EQUIPO (resumen de los mensajes hasta #" + m.getUltimoMensajeResumidoId()
                        + ") ===\n" + m.getResumen().trim())
                .orElse("=== MEMORIA DEL EQUIPO ===\n(Todavía no hay memoria acumulada)");
    }

    private String estadoProyecto(Long proyectoId, List<MiembroProyecto> miembros) {
        Proyecto p = proyectoRepo.findById(proyectoId).orElse(null);
        String lista = miembros.isEmpty() ? "(sin miembros)" : miembros.stream()
                .map(m -> "@" + m.getUsuario().getUsername() + " (" + m.getRol() + ")")
                .collect(Collectors.joining(", "));
        StringBuilder sb = new StringBuilder();
        sb.append("Proyecto: ").append(p != null ? p.getNombre() : "Proyecto").append(" · Miembros: ").append(lista).append('\n');
        if (p != null && p.getDescripcion() != null && !p.getDescripcion().isBlank()) {
            sb.append("Descripción: ").append(p.getDescripcion().trim()).append('\n');
        }
        proyectoFormatter.agregarSeccionesLienzoYGestion(proyectoId, sb);
        return sb.toString().trim();
    }

    /** Pide uno de más y descarta el disparador: la consulta va aparte, con su autor. */
    private String seccionHistorial(Long proyectoId, Long disparadorId, List<MiembroProyecto> miembros) {
        Map<Long, MiembroProyecto.Rol> roles = miembros.stream()
                .collect(Collectors.toMap(mp -> mp.getUsuario().getId(), MiembroProyecto::getRol));
        List<ChatMensaje> recientes = chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(
                        proyectoId, Limit.of(SeniorDevLimites.HISTORIAL_MENSAJES + 1)).stream()
                .filter(m -> !m.getId().equals(disparadorId))
                .limit(SeniorDevLimites.HISTORIAL_MENSAJES)
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.reverse(recientes);
        return "=== HISTORIAL RECIENTE (" + recientes.size() + " mensajes, del más viejo al más nuevo) ===\n"
                + SeniorDevHistorialFormatter.historial(recientes, roles);
    }

    private String seccionConsulta(ChatMensajeResponse d) {
        String user = d.username() != null ? d.username() : "usuario";
        String rol = d.rol() != null ? d.rol().name() : "MIEMBRO";
        String texto = SeniorDevLimites.recortar(d.contenido() != null ? d.contenido().trim() : "",
                SeniorDevLimites.CONSULTA_MAX_CHARS);
        StringBuilder sb = new StringBuilder("=== CONSULTA ACTUAL (responde a esta) ===\n");
        sb.append('#').append(d.id()).append(" [").append(user).append(" · ").append(rol).append("] pregunta: ")
                .append(texto).append('\n')
                .append("Empieza tu respuesta con @").append(user).append('.');
        if (d.rol() == MiembroProyecto.Rol.LECTOR) {
            sb.append(' ').append(user).append(" es LECTOR: no puede aplicar propuestas; si propones cambios, ")
                    .append("aclárale que un ADMIN o COLABORADOR debe aplicarlos. Sí puede ver y descargar el DDL.");
        }
        return sb.toString();
    }
}
