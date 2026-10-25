package com.casetool.backend.modules.copilot.service;

import java.util.List;

import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;

/** Port de {@code findSafeEntityPosition} (positionGuide.ts): primera celda de la grilla que no choca. */
public final class PosicionLibre {

    public record Posicion(int x, int y) {}

    static final int ANCHO = 270;
    static final int ALTO = 220;
    static final int SEP_X = 70;
    static final int SEP_Y = 60;
    static final int INICIO_X = 80;
    static final int INICIO_Y = 80;
    static final int COLUMNAS = 3;
    private static final int MARGEN = 30;

    private PosicionLibre() {
    }

    public static Posicion calcular(List<EntidadDiagramaResponse> entidades) {
        for (int fila = 0; fila < 100; fila++) {
            for (int col = 0; col < COLUMNAS; col++) {
                int x = INICIO_X + col * (ANCHO + SEP_X);
                int y = INICIO_Y + fila * (ALTO + SEP_Y);
                if (entidades.stream().noneMatch(e -> choca(x, y, e))) {
                    return new Posicion(x, y);
                }
            }
        }
        int n = entidades.size();
        return new Posicion(INICIO_X + (n % COLUMNAS) * (ANCHO + SEP_X), INICIO_Y + (n / COLUMNAS) * (ALTO + SEP_Y));
    }

    private static boolean choca(int x, int y, EntidadDiagramaResponse e) {
        double ex = e.posX() != null ? e.posX() : 0;
        double ey = e.posY() != null ? e.posY() : 0;
        return Math.abs(x - ex) < ANCHO + MARGEN && Math.abs(y - ey) < ALTO + MARGEN;
    }
}
