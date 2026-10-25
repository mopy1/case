package com.casetool.backend.modules.diagrama.service;

import static com.casetool.backend.modules.diagrama.service.DdlPostgresNombres.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

/**
 * DDL PostgreSQL generado desde el diagrama, sin IA y sin fecha: el mismo diagrama produce siempre
 * el mismo texto (byte a byte). Tablas en orden alfabético, después todas las FK como ALTER TABLE.
 */
@Service
@Transactional(readOnly = true)
public class DdlPostgresService {

    private final DiagramaService diagramaService;
    private final ProyectoAccesoService accesoService;

    public DdlPostgresService(DiagramaService diagramaService, ProyectoAccesoService accesoService) {
        this.diagramaService = diagramaService;
        this.accesoService = accesoService;
    }

    /** Cualquier miembro (incluido LECTOR) puede verlo: es solo lectura del modelo. */
    public String generar(Long proyectoId, Long usuarioId) {
        String nombreProyecto = accesoService.verificarMiembro(proyectoId, usuarioId).getProyecto().getNombre();
        return generar(nombreProyecto, diagramaService.obtenerDiagrama(proyectoId, usuarioId));
    }

    String generar(String nombreProyecto, DiagramaResponse diagrama) {
        StringBuilder sb = new StringBuilder("-- DDL PostgreSQL generado desde el diagrama de \"")
                .append(nombreProyecto).append("\" (CASE Tool)\n\n");
        List<EntidadDiagramaResponse> tablas = diagrama.entidades().stream()
                .sorted(Comparator.comparing((EntidadDiagramaResponse e) -> snake(e.nombre())).thenComparing(EntidadDiagramaResponse::id))
                .toList();
        if (tablas.isEmpty()) {
            return sb.append("-- El diagrama todavía no tiene tablas.\n").toString();
        }
        Map<Long, EntidadDiagramaResponse> porId = tablas.stream()
                .collect(Collectors.toMap(EntidadDiagramaResponse::id, Function.identity()));
        tablas.forEach(t -> crearTabla(t, sb));
        tablas.forEach(t -> columnas(t).stream().filter(a -> a.esFk() && a.referenciaEntidadId() != null)
                .forEach(a -> claveForanea(t, a, porId.get(a.referenciaEntidadId()), sb)));
        comentariosRelacionesSinFk(diagrama.relaciones(), porId, sb);
        return sb.toString();
    }

    private void crearTabla(EntidadDiagramaResponse t, StringBuilder sb) {
        List<AtributoEntidadResponse> cols = columnas(t);
        List<String> lineas = new ArrayList<>(cols.stream()
                .map(a -> ident(a.nombre()) + " " + tipo(a.tipoSql()) + (a.nullable() ? "" : " NOT NULL")).toList());
        List<String> pks = cols.stream().filter(AtributoEntidadResponse::esPk).map(a -> ident(a.nombre())).toList();
        if (!pks.isEmpty()) {
            lineas.add("PRIMARY KEY (" + String.join(", ", pks) + ")");
        }
        sb.append("CREATE TABLE ").append(ident(t.nombre())).append(" (\n");
        sb.append(lineas.isEmpty() ? "    -- sin columnas en el modelo" : "    " + String.join(",\n    ", lineas));
        sb.append("\n);\n\n");
    }

    private void claveForanea(EntidadDiagramaResponse t, AtributoEntidadResponse a, EntidadDiagramaResponse ref,
            StringBuilder sb) {
        List<AtributoEntidadResponse> pkRef = ref == null ? List.of()
                : columnas(ref).stream().filter(AtributoEntidadResponse::esPk).toList();
        if (pkRef.size() != 1) {
            sb.append("-- FK ").append(snake(t.nombre())).append('.').append(snake(a.nombre()))
                    .append(" -> ").append(ref != null ? ref.nombre() : "?")
                    .append(": la tabla referenciada no tiene PK simple, revisar el modelo\n");
            return;
        }
        sb.append("ALTER TABLE ").append(ident(t.nombre()))
                .append(" ADD CONSTRAINT ").append(ident("fk_" + snake(t.nombre()) + "_" + snake(a.nombre())))
                .append(" FOREIGN KEY (").append(ident(a.nombre())).append(") REFERENCES ")
                .append(ident(ref.nombre())).append(" (").append(ident(pkRef.get(0).nombre())).append(");\n");
    }

    /** Relaciones UML que no tienen ninguna columna FK entre sus dos tablas: quedan como comentario. */
    private void comentariosRelacionesSinFk(List<RelacionDiagramaResponse> relaciones,
            Map<Long, EntidadDiagramaResponse> porId, StringBuilder sb) {
        relaciones.stream()
                .sorted(Comparator.comparing(RelacionDiagramaResponse::id))
                .filter(r -> !tieneFk(porId.get(r.entidadOrigenId()), r.entidadDestinoId())
                        && !tieneFk(porId.get(r.entidadDestinoId()), r.entidadOrigenId()))
                .forEach(r -> sb.append("-- Relación ").append(r.entidadOrigenNombre()).append(" (")
                        .append(multiplicidad(r.multiplicidadOrigen())).append(") -> ").append(r.entidadDestinoNombre()).append(" (")
                        .append(multiplicidad(r.multiplicidadDestino())).append(") [").append(r.tipo())
                        .append("] sin columna FK en el modelo\n"));
    }

    private static boolean tieneFk(EntidadDiagramaResponse tabla, Long referenciaId) {
        return tabla != null && tabla.atributos().stream()
                .anyMatch(a -> a.esFk() && referenciaId.equals(a.referenciaEntidadId()));
    }

    /** Columnas en orden de creación (id) para que la salida no dependa del orden de la consulta. */
    private static List<AtributoEntidadResponse> columnas(EntidadDiagramaResponse t) {
        return t.atributos().stream().sorted(Comparator.comparing(AtributoEntidadResponse::id)).toList();
    }
}
