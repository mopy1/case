package com.casetool.backend.modules.diagrama.service;

import java.util.List;

import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;

/**
 * Dónde va una tabla intermedia nueva: lo más cerca posible del punto medio entre las dos tablas que une,
 * pero en un hueco libre. Antes se ponía siempre 220 px debajo del medio y, con diagramas importados,
 * caía encima de otra tabla. Caja aproximada de una tarjeta del lienzo (w-64 = 256 px, ~170 px de alto)
 * + margen; con 220 de alto la primera opción (220 px abajo) chocaba siempre con las propias tablas.
 */
final class PosicionTablaIntermedia {

    record Posicion(double x, double y) {}

    private static final double ANCHO = 260;
    private static final double ALTO = 170;
    private static final double MARGEN = 30;
    private static final double[] DESPLAZAMIENTOS_Y = { 220, -220, 440, -440, 660 };
    private static final double[] DESPLAZAMIENTOS_X = { 0, 300, -300, 600, -600 };

    private PosicionTablaIntermedia() {
    }

    static Posicion calcular(EntidadDiagrama origen, EntidadDiagrama destino, List<EntidadDiagrama> existentes) {
        boolean recursiva = origen.getId().equals(destino.getId());
        // Recursiva: al costado, para no quedar debajo del lazo de la relación.
        double baseX = recursiva ? x(origen) + 350 : (x(origen) + x(destino)) / 2;
        double baseY = recursiva ? y(origen) : Math.max(y(origen), y(destino));
        for (double dy : DESPLAZAMIENTOS_Y) {
            for (double dx : DESPLAZAMIENTOS_X) {
                double cx = Math.max(0, baseX + dx);
                double cy = Math.max(0, baseY + dy);
                if (existentes.stream().noneMatch(e -> choca(cx, cy, e))) return new Posicion(cx, cy);
            }
        }
        return new Posicion(baseX, baseY + DESPLAZAMIENTOS_Y[0]);
    }

    private static boolean choca(double cx, double cy, EntidadDiagrama e) {
        return Math.abs(cx - x(e)) < ANCHO + MARGEN && Math.abs(cy - y(e)) < ALTO + MARGEN;
    }

    private static double x(EntidadDiagrama e) {
        return e.getPosX() != null ? e.getPosX() : 0;
    }

    private static double y(EntidadDiagrama e) {
        return e.getPosY() != null ? e.getPosY() : 0;
    }
}
