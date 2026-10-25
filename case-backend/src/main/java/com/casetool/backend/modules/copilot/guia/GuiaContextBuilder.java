package com.casetool.backend.modules.copilot.guia;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.copilot.dto.CopilotTurno;
import com.casetool.backend.modules.copilot.dto.MisionGuia;
import com.casetool.backend.modules.copilot.service.CopilotLimites;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;

/** Arma el mensaje {@code user} de la Guía: contexto del usuario y del proyecto, conversación y pregunta. */
@Component
public class GuiaContextBuilder {

    private static final Map<String, String> SECCIONES = Map.of(
            "diagrama", "Diagrama", "tareas", "Tareas", "notas", "Notas",
            "xmi", "XMI", "generador", "Generador de backend", "general", "General");

    private final MiembroProyectoRepository miembroRepo;

    public GuiaContextBuilder(MiembroProyectoRepository miembroRepo) {
        this.miembroRepo = miembroRepo;
    }

    public String usuario(GuiaContexto ctx) {
        StringBuilder sb = new StringBuilder("=== CONTEXTO ===\n")
                .append("Usuario: @").append(ctx.username()).append(" · rol ").append(ctx.rol()).append('\n')
                .append("Sección actual: ").append(SECCIONES.getOrDefault(ctx.seccion(), "General")).append('\n')
                .append("Proyecto: ").append(resumenProyecto(ctx.diagrama(), miembroRepo.findByProyectoId(ctx.proyectoId()).size()))
                .append('\n')
                .append("Misiones pendientes: ").append(misiones(ctx.misionesPendientes())).append('\n');
        List<CopilotTurno> historial = ctx.historial() != null ? ctx.historial() : List.of();
        if (!historial.isEmpty()) {
            sb.append("=== CONVERSACIÓN RECIENTE ===\n");
            historial.stream().skip(Math.max(0, historial.size() - CopilotLimites.GUIA_HISTORIAL_TURNOS))
                    .forEach(t -> sb.append("asistente".equals(t.rol()) ? "Guía: " : "Usuario: ")
                            .append(CopilotLimites.recortar(t.texto().strip(), CopilotLimites.TURNO_MAX_CHARS)).append('\n'));
        }
        return sb.append("=== PREGUNTA ===\n").append(ctx.pregunta()).toString();
    }

    static String resumenProyecto(DiagramaResponse d, int miembros) {
        int tablas = d.entidades().size();
        long conAtributos = d.entidades().stream().filter(e -> e.atributos() != null && !e.atributos().isEmpty()).count();
        int relaciones = d.relaciones().size();
        return plural(tablas, "tabla", "tablas") + " (" + conAtributos + " con atributos) · "
                + plural(relaciones, "relación", "relaciones") + " · " + plural(miembros, "miembro", "miembros");
    }

    static String misiones(List<MisionGuia> pendientes) {
        if (pendientes == null || pendientes.isEmpty()) return "ninguna";
        return pendientes.stream().distinct().map(MisionGuia::titulo).collect(Collectors.joining("; "));
    }

    private static String plural(long n, String uno, String varios) {
        return n + " " + (n == 1 ? uno : varios);
    }
}
