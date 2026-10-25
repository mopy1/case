package com.casetool.backend.modules.chat.ia.tools;

import static com.casetool.backend.modules.chat.ia.SeniorDevLimites.*;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.chat.ia.SeniorDevProyectoFormatter;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.proyecto.service.NotaProyectoService;
import com.casetool.backend.modules.proyecto.service.TareaProyectoService;

/**
 * obtenerDiagrama, listarTareas y listarNotas: reusan los services de lectura existentes, que ya
 * verifican la membresía del autor con ProyectoAccesoService. Devuelven texto compacto (no JSON).
 */
@Component
public class HerramientasProyecto {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneOffset.UTC);

    private final DiagramaService diagramaService;
    private final TareaProyectoService tareaService;
    private final NotaProyectoService notaService;

    public HerramientasProyecto(DiagramaService diagramaService, TareaProyectoService tareaService,
            NotaProyectoService notaService) {
        this.diagramaService = diagramaService;
        this.tareaService = tareaService;
        this.notaService = notaService;
    }

    /** {@code Tabla Pedido: id BIGINT PK NOT NULL; cliente_id BIGINT FK→Cliente NOT NULL; …} + relaciones. */
    public String obtenerDiagrama(Long proyectoId, Long usuarioId, String tabla) {
        var diagrama = diagramaService.obtenerDiagrama(proyectoId, usuarioId);
        List<EntidadDiagramaResponse> entidades = diagrama.entidades().stream()
                .filter(e -> tabla == null || e.nombre().equalsIgnoreCase(tabla)).toList();
        if (entidades.isEmpty()) {
            String todas = diagrama.entidades().stream().map(EntidadDiagramaResponse::nombre).collect(Collectors.joining(", "));
            return tabla == null ? "El diagrama no tiene tablas."
                    : "No existe la tabla \"" + tabla + "\". Tablas: " + (todas.isEmpty() ? "(ninguna)" : todas);
        }
        StringBuilder sb = new StringBuilder();
        for (EntidadDiagramaResponse e : entidades) {
            sb.append("Tabla ").append(e.nombre()).append(": ")
                    .append(e.atributos().stream().map(HerramientasProyecto::columna).collect(Collectors.joining("; ")))
                    .append('\n');
        }
        List<RelacionDiagramaResponse> relaciones = diagrama.relaciones().stream()
                .filter(r -> tabla == null || r.entidadOrigenNombre().equalsIgnoreCase(tabla)
                        || r.entidadDestinoNombre().equalsIgnoreCase(tabla)).toList();
        sb.append("Relaciones:").append(relaciones.isEmpty() ? " (ninguna)" : "").append('\n');
        for (RelacionDiagramaResponse r : relaciones) {
            sb.append("- ").append(r.entidadOrigenNombre()).append(" (")
                    .append(SeniorDevProyectoFormatter.multiplicidad(r.multiplicidadOrigen())).append(") -> ")
                    .append(r.entidadDestinoNombre()).append(" (")
                    .append(SeniorDevProyectoFormatter.multiplicidad(r.multiplicidadDestino())).append(") [")
                    .append(r.tipo()).append("]\n");
        }
        return sb.toString().trim();
    }

    /** {@code [PENDIENTE] Título (ALTA, @maria): descripción}, filtrando por estado y asignado. */
    public String listarTareas(Long proyectoId, Long usuarioId, String estado, String asignado) {
        String quien = asignado != null ? asignado.replaceFirst("^@", "") : null;
        String lineas = tareaService.listarPorProyecto(proyectoId, usuarioId).stream()
                .filter(t -> estado == null || t.estado().name().equalsIgnoreCase(estado))
                .filter(t -> quien == null || quien.equalsIgnoreCase(t.usuarioUsername()))
                .map(t -> "[" + t.estado() + "] " + t.titulo() + " (" + t.prioridad() + ", "
                        + (t.usuarioUsername() != null ? "@" + t.usuarioUsername() : "sin asignar") + ")"
                        + (t.descripcion() != null && !t.descripcion().isBlank() ? ": " + t.descripcion().trim() : ""))
                .collect(Collectors.joining("\n"));
        return lineas.isEmpty() ? "Sin tareas que coincidan." : lineas;
    }

    /** {@code #7 Acción (por maria, 2026-10-20): motivo}, de la más nueva a la más vieja. */
    public String listarNotas(Long proyectoId, Long usuarioId, String texto, Integer limite) {
        String filtro = texto != null ? texto.toLowerCase() : null;
        String lineas = notaService.listar(proyectoId, usuarioId).stream()
                .filter(n -> filtro == null || contiene(n.accion(), filtro) || contiene(n.motivo(), filtro))
                .limit(acotar(limite, NOTAS_LIMITE_DEFAULT, 1, NOTAS_LIMITE_MAX))
                .map(n -> "#" + n.id() + " " + n.accion() + " (por " + n.username() + ", "
                        + (n.createdAt() != null ? FECHA.format(n.createdAt()) : "s/f") + ")"
                        + (n.motivo() != null && !n.motivo().isBlank() ? ": " + n.motivo().trim() : ""))
                .collect(Collectors.joining("\n"));
        return lineas.isEmpty() ? "Sin decisiones (ADR) que coincidan." : lineas;
    }

    private static String columna(AtributoEntidadResponse a) {
        StringBuilder sb = new StringBuilder(a.nombre()).append(' ').append(a.tipoSql());
        if (a.esPk()) sb.append(" PK");
        if (a.esFk()) sb.append(" FK→").append(a.referenciaEntidadNombre() != null ? a.referenciaEntidadNombre() : "?");
        return sb.append(a.nullable() ? " NULL" : " NOT NULL").toString();
    }

    private static boolean contiene(String valor, String filtro) {
        return valor != null && valor.toLowerCase().contains(filtro);
    }
}
