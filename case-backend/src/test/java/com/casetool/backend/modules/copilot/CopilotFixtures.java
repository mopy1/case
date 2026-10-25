package com.casetool.backend.modules.copilot;

import java.util.List;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;

/** Diagramas en memoria para los tests del Copilot y la Guía. */
public final class CopilotFixtures {

    private CopilotFixtures() {
    }

    public static EntidadDiagramaResponse entidad(long id, String nombre, double x, double y, AtributoEntidadResponse... attrs) {
        return new EntidadDiagramaResponse(id, 1L, nombre, x, y, List.of(attrs), null);
    }

    public static AtributoEntidadResponse atributo(String nombre, String tipo, boolean pk) {
        return new AtributoEntidadResponse(1L, 1L, nombre, tipo, pk, false, null, null, true);
    }

    public static RelacionDiagramaResponse relacion(long o, String origen, long d, String destino) {
        return new RelacionDiagramaResponse(9L, 1L, o, origen, d, destino, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS,
                List.of(), TipoRelacionUml.ASOCIACION);
    }

    public static DiagramaResponse vacio() {
        return new DiagramaResponse(List.of(), List.of());
    }

    /** Libro(id PK, titulo) y Autor sin atributos, relacionados 1 → 1..*. */
    public static DiagramaResponse libroAutor() {
        return new DiagramaResponse(
                List.of(entidad(1, "Libro", 80, 80, atributo("id", "BIGINT", true), atributo("titulo", "VARCHAR", false)),
                        entidad(2, "Autor", 420.5, 80)),
                List.of(relacion(2, "Autor", 1, "Libro")));
    }
}
