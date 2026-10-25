package com.casetool.backend.modules.diagrama.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.diagrama.dto.*;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@ExtendWith(MockitoExtension.class)
class DdlPostgresServiceTest {

    @Mock DiagramaService diagramaService;
    @Mock ProyectoAccesoService accesoService;
    @InjectMocks DdlPostgresService service;

    private final EntidadDiagramaResponse cliente = tabla(1L, "Cliente",
            col(10L, 1L, "id", "BIGINT", true, false, null, false),
            col(11L, 1L, "nombre", "VARCHAR", false, false, null, false),
            col(12L, 1L, "saldo", "DECIMAL", false, false, null, true));
    private final EntidadDiagramaResponse pedido = tabla(2L, "Pedido",
            col(20L, 2L, "id", "BIGINT", true, false, null, false),
            col(21L, 2L, "cliente_id", "BIGINT", false, true, 1L, false));
    private final EntidadDiagramaResponse detalle = tabla(3L, "DetallePedido",
            col(31L, 3L, "producto_id", "BIGINT", true, false, null, false),
            col(30L, 3L, "pedido_id", "BIGINT", true, true, 2L, false));
    private final EntidadDiagramaResponse auditoria = tabla(4L, "Auditoria");

    @Test
    void generaTablasOrdenadasConNotNullPkYForeignKeys() {
        String ddl = service.generar("Tienda", diagrama(List.of(rel(9L, 1L, "Cliente", 2L, "Pedido"),
                rel(8L, 4L, "Auditoria", 1L, "Cliente"))));

        assertThat(ddl)
                .startsWith("-- DDL PostgreSQL generado desde el diagrama de \"Tienda\" (CASE Tool)\n")
                .contains("CREATE TABLE cliente (\n    id BIGINT NOT NULL,\n    nombre VARCHAR(255) NOT NULL,\n"
                        + "    saldo NUMERIC(12,2),\n    PRIMARY KEY (id)\n);")
                .contains("CREATE TABLE detalle_pedido (\n    pedido_id BIGINT NOT NULL,\n    producto_id BIGINT NOT NULL,\n"
                        + "    PRIMARY KEY (pedido_id, producto_id)\n);")
                .contains("CREATE TABLE auditoria (\n    -- sin columnas en el modelo\n);")
                .contains("ALTER TABLE pedido ADD CONSTRAINT fk_pedido_cliente_id FOREIGN KEY (cliente_id) REFERENCES cliente (id);")
                .contains("ALTER TABLE detalle_pedido ADD CONSTRAINT fk_detalle_pedido_pedido_id FOREIGN KEY (pedido_id) REFERENCES pedido (id);")
                .contains("-- Relación Auditoria (1) -> Cliente (0..*) [ASOCIACION] sin columna FK en el modelo")
                .doesNotContain("-- Relación Cliente");
        assertThat(ddl.indexOf("CREATE TABLE auditoria")).isLessThan(ddl.indexOf("CREATE TABLE cliente"));
        assertThat(ddl.indexOf("CREATE TABLE pedido")).isLessThan(ddl.indexOf("ALTER TABLE"));
    }

    @Test
    void fkHaciaTablaSinPkSimpleQuedaComentada() {
        var factura = tabla(5L, "Factura", col(50L, 5L, "detalle_id", "BIGINT", false, true, 3L, false));
        String ddl = service.generar("T", new DiagramaResponse(List.of(detalle, pedido, cliente, factura), List.of()));

        assertThat(ddl).contains("-- FK factura.detalle_id -> DetallePedido: la tabla referenciada no tiene PK simple");
    }

    @Test
    void diagramaVacioSoloDevuelveComentario() {
        assertThat(service.generar("Vacío", new DiagramaResponse(List.of(), List.of())))
                .isEqualTo("-- DDL PostgreSQL generado desde el diagrama de \"Vacío\" (CASE Tool)\n\n"
                        + "-- El diagrama todavía no tiene tablas.\n");
    }

    @Test
    void esDeterministicoYVerificaMembresia() {
        Proyecto p = new Proyecto();
        p.setNombre("Tienda");
        MiembroProyecto lector = new MiembroProyecto();
        lector.setProyecto(p);
        lector.setRol(MiembroProyecto.Rol.LECTOR);
        when(accesoService.verificarMiembro(7L, 3L)).thenReturn(lector);
        when(diagramaService.obtenerDiagrama(7L, 3L)).thenReturn(diagrama(List.of()));

        assertThat(service.generar(7L, 3L)).isEqualTo(service.generar(7L, 3L)).contains("\"Tienda\"");
    }

    @Test
    void nombresEnSnakeCaseYComillasSoloSiHaceFalta() {
        assertThat(DdlPostgresNombres.snake("DetallePedido")).isEqualTo("detalle_pedido");
        assertThat(DdlPostgresNombres.snake("Fecha de Alta")).isEqualTo("fecha_de_alta");
        assertThat(DdlPostgresNombres.ident("Año")).isEqualTo("\"año\"");
        assertThat(DdlPostgresNombres.tipo("int; DROP")).isEqualTo("INT DROP");
    }

    private DiagramaResponse diagrama(List<RelacionDiagramaResponse> relaciones) {
        return new DiagramaResponse(List.of(pedido, cliente, detalle, auditoria), relaciones);
    }

    private static EntidadDiagramaResponse tabla(Long id, String nombre, AtributoEntidadResponse... cols) {
        return new EntidadDiagramaResponse(id, 7L, nombre, 0.0, 0.0, List.of(cols), null);
    }

    private static AtributoEntidadResponse col(Long id, Long entidad, String nombre, String tipo, boolean pk, boolean fk,
            Long ref, boolean nullable) {
        return new AtributoEntidadResponse(id, entidad, nombre, tipo, pk, fk, ref, null, nullable);
    }

    private static RelacionDiagramaResponse rel(Long id, Long o, String on, Long d, String dn) {
        return new RelacionDiagramaResponse(id, 7L, o, on, d, dn, Multiplicidad.UNO, Multiplicidad.CERO_O_MAS,
                List.of(), TipoRelacionUml.ASOCIACION);
    }
}
