package com.casetool.backend.modules.xmi.service;

import java.util.List;

/**
 * Conversión de posiciones lienzo ↔ Enterprise Architect sin amontonar. Una tarjeta del lienzo mide
 * 256 × (52 + 28·n) px y una clase de EA ~120 × (40 + 14·n), así que una escala fija encima o separa de más
 * según lo denso que sea el diagrama. En vez de eso se usa la <b>menor escala uniforme</b> que deja al menos
 * un hueco (margen) entre cada par de cajas: uniforme = se conserva la forma en que el usuario ordenó el
 * diagrama; mínima = no queda desparramado. Funciones puras.
 */
public final class XmiEscalaEA {

    /** Caja en coordenadas de ORIGEN con el tamaño que tendrá en el DESTINO. */
    public record Caja(double x, double y, double ancho, double alto) {
    }

    /** Marca del export propio: sus coordenadas están en escala EA (los exports viejos estaban 1:1). */
    public static final String TAG_COORDENADAS = "case_coordenadas";
    public static final String VALOR_EA = "ea";

    /** Huecos mínimos entre tablas: en el lienzo (px de React Flow) y en EA (px de EA). */
    public static final double HUECO_LIENZO_X = 110;
    public static final double HUECO_LIENZO_Y = 90;
    public static final double HUECO_EA_X = 70;
    public static final double HUECO_EA_Y = 50;

    private XmiEscalaEA() {
    }

    public static double anchoLienzo() {
        return 256;
    }

    public static double altoLienzo(int atributos) {
        return 52 + 28 * atributos;
    }

    public static double anchoEA() {
        return 120;
    }

    public static double altoEA(int atributos) {
        return 40 + 14 * atributos;
    }

    /**
     * Menor factor s tal que, al multiplicar las distancias por s, cada par de cajas queda separado por al
     * menos el hueco en X o en Y (alcanza con uno de los dos ejes). 1 si hay menos de 2 cajas.
     */
    public static double escala(List<Caja> cajas, double huecoX, double huecoY) {
        double s = 0;
        for (int i = 0; i < cajas.size(); i++) {
            for (int j = i + 1; j < cajas.size(); j++) {
                Caja a = cajas.get(i);
                Caja b = cajas.get(j);
                double dx = b.x() - a.x();
                double dy = b.y() - a.y();
                double necesariaX = dx == 0 ? Double.POSITIVE_INFINITY : ((dx > 0 ? a.ancho() : b.ancho()) + huecoX) / Math.abs(dx);
                double necesariaY = dy == 0 ? Double.POSITIVE_INFINITY : ((dy > 0 ? a.alto() : b.alto()) + huecoY) / Math.abs(dy);
                double necesaria = Math.min(necesariaX, necesariaY);
                if (Double.isFinite(necesaria)) s = Math.max(s, necesaria);
            }
        }
        return s > 0 ? s : 1;
    }
}
