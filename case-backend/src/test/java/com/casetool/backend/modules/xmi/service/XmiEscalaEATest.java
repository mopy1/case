package com.casetool.backend.modules.xmi.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.xmi.service.XmiEscalaEA.Caja;

class XmiEscalaEATest {

    /** Grilla apretada de EA (cajas de 90 px a 100 px de distancia): al pasarla al lienzo nada se pisa. */
    @Test
    void diagramaDensoNoSeSolapa() {
        List<Caja> cajas = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            cajas.add(new Caja((i % 4) * 100, (i / 4) * 80, XmiEscalaEA.anchoLienzo(), XmiEscalaEA.altoLienzo(3)));
        }
        double s = XmiEscalaEA.escala(cajas, XmiEscalaEA.HUECO_LIENZO_X, XmiEscalaEA.HUECO_LIENZO_Y);
        for (int i = 0; i < cajas.size(); i++) {
            for (int j = i + 1; j < cajas.size(); j++) {
                Caja a = cajas.get(i);
                Caja b = cajas.get(j);
                boolean separadasX = Math.abs(b.x() - a.x()) * s >= XmiEscalaEA.anchoLienzo() + XmiEscalaEA.HUECO_LIENZO_X - 1e-6;
                boolean separadasY = Math.abs(b.y() - a.y()) * s >= XmiEscalaEA.altoLienzo(3) + XmiEscalaEA.HUECO_LIENZO_Y - 1e-6;
                assertThat(separadasX || separadasY).as("%s vs %s", a, b).isTrue();
            }
        }
    }

    /** Lienzo muy separado → se compacta (escala < 1) en vez de quedar desparramado en EA. */
    @Test
    void lienzoSeparadoSeCompactaParaEA() {
        List<Caja> cajas = List.of(new Caja(0, 0, 120, 68), new Caja(1000, 0, 120, 68), new Caja(0, 800, 120, 68));
        double s = XmiEscalaEA.escala(cajas, XmiEscalaEA.HUECO_EA_X, XmiEscalaEA.HUECO_EA_Y);
        assertThat(s).isLessThan(1);
        assertThat(1000 * s).isGreaterThanOrEqualTo(120 + XmiEscalaEA.HUECO_EA_X - 1e-6);
    }
}
