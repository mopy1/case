package com.casetool.backend.modules.diagrama.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Un punto de control manual de una relación (coordenadas en flow-space del lienzo del
 * frontend), guardado dentro de {@link RelacionDiagrama#getPuntosControl()} como JSON — no es una
 * entidad JPA propia, no hace falta una tabla aparte para 2 doubles por punto.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PuntoControl {
    private double x;
    private double y;
}
