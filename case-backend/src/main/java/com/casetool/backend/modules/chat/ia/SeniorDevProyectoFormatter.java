package com.casetool.backend.modules.chat.ia;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.diagrama.model.AtributoEntidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.repository.AtributoEntidadRepository;
import com.casetool.backend.modules.diagrama.repository.EntidadDiagramaRepository;
import com.casetool.backend.modules.diagrama.repository.RelacionDiagramaRepository;
import com.casetool.backend.modules.proyecto.repository.NotaProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.TareaProyectoRepository;

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
        sb.append("\nTablas y Atributos (Diagrama UML actual):\n");
        var entidades = entidadRepo.findByProyectoId(proyectoId);
        var atributos = atributoRepo.findByProyectoId(proyectoId).stream()
                .collect(Collectors.groupingBy(a -> a.getEntidad().getId()));
        if (entidades.isEmpty()) sb.append("- (Sin tablas modeladas)\n");
        for (var e : entidades) {
            var attrs = atributos.getOrDefault(e.getId(), List.of()).stream()
                    .map(this::formatoAtributo).collect(Collectors.joining(", "));
            sb.append("- ").append(e.getNombre()).append(" (").append(attrs).append(")\n");
        }

        sb.append("\nRelaciones UML:\n");
        var relaciones = relacionRepo.findByProyectoId(proyectoId);
        if (relaciones.isEmpty()) sb.append("- (Sin relaciones definidas)\n");
        for (var r : relaciones) {
            sb.append("- ").append(r.getEntidadOrigen().getNombre()).append(" (").append(multiplicidad(r.getMultiplicidadOrigen()))
                    .append(") -> ").append(r.getEntidadDestino().getNombre()).append(" (").append(multiplicidad(r.getMultiplicidadDestino()))
                    .append(") [").append(r.getTipo() != null ? r.getTipo() : "ASOCIACION").append("]\n");
        }

        sb.append("\nTareas del Proyecto:\n");
        var tareas = tareaRepo.findByProyectoIdOrderByCreatedAtDesc(proyectoId);
        if (tareas.isEmpty()) sb.append("- (Sin tareas registradas)\n");
        for (var t : tareas) {
            String asignado = t.getUsuario() != null ? t.getUsuario().getUsername() : "sin asignar";
            sb.append("- [").append(t.getEstado()).append("] ").append(t.getTitulo())
                    .append(" (Prioridad: ").append(t.getPrioridad()).append(", Asignado: ").append(asignado).append(")\n");
        }

        sb.append("\nDecisiones de Arquitectura (ADR):\n");
        var notas = notaRepo.findByProyectoIdOrderByCreatedAtDesc(proyectoId);
        if (notas.isEmpty()) sb.append("- (Sin decisiones registradas)\n");
        for (var n : notas) {
            String autor = n.getUsuario() != null ? n.getUsuario().getUsername() : "desconocido";
            sb.append("- ").append(n.getAccion()).append(" (por ").append(autor).append(")")
                    .append(n.getMotivo() != null && !n.getMotivo().isBlank() ? ": " + n.getMotivo().trim() : "").append("\n");
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

    private String multiplicidad(RelacionDiagrama.Multiplicidad m) {
        if (m == null) return "1";
        return switch (m) {
            case UNO -> "1";
            case CERO_O_UNO -> "0..1";
            case UNO_O_MAS -> "1..*";
            case CERO_O_MAS -> "0..*";
        };
    }
}
