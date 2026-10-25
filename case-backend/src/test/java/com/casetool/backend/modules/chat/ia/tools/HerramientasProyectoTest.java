package com.casetool.backend.modules.chat.ia.tools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.diagrama.dto.*;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.proyecto.dto.NotaProyectoResponse;
import com.casetool.backend.modules.proyecto.dto.TareaProyectoResponse;
import com.casetool.backend.modules.proyecto.model.TareaProyecto.Estado;
import com.casetool.backend.modules.proyecto.model.TareaProyecto.Prioridad;
import com.casetool.backend.modules.proyecto.service.NotaProyectoService;
import com.casetool.backend.modules.proyecto.service.TareaProyectoService;

@ExtendWith(MockitoExtension.class)
class HerramientasProyectoTest {

    private static final Long P = 7L;
    private static final Long U = 3L;

    @Mock DiagramaService diagramaService;
    @Mock TareaProyectoService tareaService;
    @Mock NotaProyectoService notaService;
    @InjectMocks HerramientasProyecto herramientas;

    @Test
    void obtenerDiagramaFiltraPorTablaConNullableYFk() {
        var cliente = new EntidadDiagramaResponse(1L, P, "Cliente", 0.0, 0.0,
                List.of(new AtributoEntidadResponse(10L, 1L, "id", "BIGINT", true, false, null, null, false)), null);
        var pedido = new EntidadDiagramaResponse(2L, P, "Pedido", 0.0, 0.0, List.of(
                new AtributoEntidadResponse(20L, 2L, "cliente_id", "BIGINT", false, true, 1L, "Cliente", false),
                new AtributoEntidadResponse(21L, 2L, "nota", "VARCHAR", false, false, null, null, true)), null);
        var rel = new RelacionDiagramaResponse(5L, P, 1L, "Cliente", 2L, "Pedido", Multiplicidad.UNO,
                Multiplicidad.CERO_O_MAS, List.of(), TipoRelacionUml.ASOCIACION);
        when(diagramaService.obtenerDiagrama(P, U)).thenReturn(new DiagramaResponse(List.of(cliente, pedido), List.of(rel)));

        assertThat(herramientas.obtenerDiagrama(P, U, "pedido"))
                .isEqualTo("Tabla Pedido: cliente_id BIGINT FK→Cliente NOT NULL; nota VARCHAR NULL\n"
                        + "Relaciones:\n- Cliente (1) -> Pedido (0..*) [ASOCIACION]");
        assertThat(herramientas.obtenerDiagrama(P, U, "Factura")).isEqualTo("No existe la tabla \"Factura\". Tablas: Cliente, Pedido");
    }

    @Test
    void listarTareasFiltraPorEstadoYAsignado() {
        when(tareaService.listarPorProyecto(P, U)).thenReturn(List.of(
                tarea("Definir índices", "Revisar búsquedas", Estado.PENDIENTE, "maria"),
                tarea("Login", null, Estado.HECHO, "maria"),
                tarea("Estilos", "", Estado.PENDIENTE, null)));

        assertThat(herramientas.listarTareas(P, U, "pendiente", "@maria"))
                .isEqualTo("[PENDIENTE] Definir índices (ALTA, @maria): Revisar búsquedas");
        assertThat(herramientas.listarTareas(P, U, "EN_PROGRESO", null)).isEqualTo("Sin tareas que coincidan.");
        assertThat(herramientas.listarTareas(P, U, null, null).lines()).hasSize(3);
    }

    @Test
    void listarNotasFiltraPorTextoYRespetaElLimite() {
        Instant fecha = Instant.parse("2026-10-20T15:00:00Z");
        when(notaService.listar(P, U)).thenReturn(List.of(
                new NotaProyectoResponse(8L, 2L, "maria", "Borrado lógico en Cliente", "Pedido guarda historial", fecha),
                new NotaProyectoResponse(7L, 1L, "adrian", "Usar BIGINT como PK", "Consistencia", fecha)));

        assertThat(herramientas.listarNotas(P, U, "HISTORIAL", null))
                .isEqualTo("#8 Borrado lógico en Cliente (por maria, 2026-10-20): Pedido guarda historial");
        assertThat(herramientas.listarNotas(P, U, null, 1).lines()).hasSize(1);
        assertThat(herramientas.listarNotas(P, U, "nada", 5)).isEqualTo("Sin decisiones (ADR) que coincidan.");
    }

    private static TareaProyectoResponse tarea(String titulo, String desc, Estado estado, String asignado) {
        return new TareaProyectoResponse(1L, P, asignado != null ? 2L : null, asignado, titulo, desc,
                Prioridad.ALTA, estado, Instant.now());
    }
}
