package com.casetool.backend.modules.chat.ia;

import static com.casetool.backend.modules.chat.ia.SeniorDevLimites.*;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.diagrama.model.AtributoEntidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.repository.AtributoEntidadRepository;
import com.casetool.backend.modules.diagrama.repository.EntidadDiagramaRepository;
import com.casetool.backend.modules.diagrama.repository.RelacionDiagramaRepository;
import com.casetool.backend.modules.proyecto.model.TareaProyecto;
import com.casetool.backend.modules.proyecto.repository.NotaProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.TareaProyectoRepository;

/** Estado COMPACTO del proyecto (capa 3a); el detalle exacto lo piden las herramientas. */
@Component
public class SeniorDevProyectoFormatter {

    private final EntidadDiagramaRepository entidadRepo;
    private final AtributoEntidadRepository atributoRepo;
    private final RelacionDiagramaRepository relacionRepo;
    private final TareaProyectoRepository tareaRepo;
    private final NotaProyectoRepository notaRepo;

    public SeniorDevProyectoFormatter(
            EntidadDiagramaRepository entidadRepo, AtributoEntidadRepository atributoRepo,
            RelacionDiagramaRepository relacionRepo, TareaProyectoRepository tareaRepo,
            NotaProyectoRepository notaRepo) {
        this.entidadRepo = entidadRepo;
        this.atributoRepo = atributoRepo;
        this.relacionRepo = relacionRepo;
        this.tareaRepo = tareaRepo;
        this.notaRepo = notaRepo;
    }

    public void agregarSeccionesLienzoYGestion(Long proyectoId, StringBuilder sb) {
        sb.append("\nTablas (solo tipo, PK y FK; para saber si una columna acepta NULL usa obtenerDiagrama):\n");
        var entidades = entidadRepo.findByProyectoId(proyectoId);
        var atributos = atributoRepo.findByProyectoId(proyectoId).stream()
                .collect(Collectors.groupingBy(a -> a.getEntidad().getId()));
        if (entidades.isEmpty()) sb.append("- (Sin tablas modeladas)\n");
        for (var e : entidades.stream().limit(ESTADO_MAX_TABLAS).toList()) {
            var attrs = atributos.getOrDefault(e.getId(), List.of()).stream()
                    .map(this::formatoAtributo).collect(Collectors.joining(", "));
            sb.append("- ").append(e.getNombre()).append(" (").append(attrs).append(")\n");
        }
        if (entidades.size() > ESTADO_MAX_TABLAS) {
            sb.append("- (+").append(entidades.size() - ESTADO_MAX_TABLAS).append(" más: usa obtenerDiagrama)\n");
        }

        sb.append("\nRelaciones:\n");
        var relaciones = relacionRepo.findByProyectoId(proyectoId);
        if (relaciones.isEmpty()) sb.append("- (Sin relaciones definidas)\n");
        for (var r : relaciones) {
            sb.append("- ").append(r.getEntidadOrigen().getNombre()).append(" (").append(multiplicidad(r.getMultiplicidadOrigen()))
                    .append(") -> ").append(r.getEntidadDestino().getNombre()).append(" (").append(multiplicidad(r.getMultiplicidadDestino()))
                    .append(") [").append(r.getTipo() != null ? r.getTipo() : "ASOCIACION").append("]\n");
        }

        agregarTareas(proyectoId, sb);
        agregarNotas(proyectoId, sb);
    }

    private void agregarTareas(Long proyectoId, StringBuilder sb) {
        var tareas = tareaRepo.findByProyectoIdOrderByCreatedAtDesc(proyectoId);
        var abiertas = tareas.stream().filter(t -> t.getEstado() != TareaProyecto.Estado.HECHO).toList();
        sb.append("\nTareas abiertas (").append(abiertas.size()).append(" de ").append(tareas.size())
                .append("; ").append(tareas.size() - abiertas.size()).append(" HECHO):\n");
        if (abiertas.isEmpty()) sb.append("- (Sin tareas abiertas)\n");
        for (var t : abiertas.stream().limit(ESTADO_MAX_TAREAS).toList()) {
            String asignado = t.getUsuario() != null ? "@" + t.getUsuario().getUsername() : "sin asignar";
            sb.append("- [").append(t.getEstado()).append("] ").append(t.getTitulo())
                    .append(" (").append(t.getPrioridad()).append(", ").append(asignado).append(")\n");
        }
        if (abiertas.size() > ESTADO_MAX_TAREAS) {
            sb.append("- (+").append(abiertas.size() - ESTADO_MAX_TAREAS).append(" más: usa listarTareas)\n");
        }
    }

    private void agregarNotas(Long proyectoId, StringBuilder sb) {
        var notas = notaRepo.findByProyectoIdOrderByCreatedAtDesc(proyectoId);
        sb.append("\nADR recientes (").append(Math.min(notas.size(), ESTADO_MAX_NOTAS)).append(" de ")
                .append(notas.size()).append("):\n");
        if (notas.isEmpty()) sb.append("- (Sin decisiones registradas)\n");
        for (var n : notas.stream().limit(ESTADO_MAX_NOTAS).toList()) {
            String autor = n.getUsuario() != null ? n.getUsuario().getUsername() : "desconocido";
            String motivo = n.getMotivo() != null ? n.getMotivo().replaceAll("\\s+", " ").trim() : "";
            sb.append("- ").append(n.getAccion()).append(" (por ").append(autor).append(")")
                    .append(motivo.isEmpty() ? "" : ": " + recortar(motivo, ESTADO_MOTIVO_CHARS)).append("\n");
        }
    }

    private String formatoAtributo(AtributoEntidad a) {
        StringBuilder sb = new StringBuilder(a.getNombre()).append(": ").append(a.getTipoSql());
        if (a.isEsPk()) sb.append(" PK");
        if (a.isEsFk()) {
            sb.append(" FK");
            if (a.getReferenciaEntidad() != null) {
                sb.append(" -> ").append(a.getReferenciaEntidad().getNombre());
            }
        }
        return sb.toString();
    }

    /** Notación UML de la multiplicidad (la reutiliza la herramienta obtenerDiagrama). */
    public static String multiplicidad(RelacionDiagrama.Multiplicidad m) {
        if (m == null) return "1";
        return switch (m) {
            case UNO -> "1";
            case CERO_O_UNO -> "0..1";
            case UNO_O_MAS -> "1..*";
            case CERO_O_MAS -> "0..*";
        };
    }
}
