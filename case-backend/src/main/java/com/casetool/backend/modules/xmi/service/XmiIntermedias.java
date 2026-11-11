package com.casetool.backend.modules.xmi.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;

/**
 * Antes de crear nada: si una N:M sin clase asociación ya tiene su tabla intermedia dibujada a mano
 * en el archivo (clase J con A 1 → * J y B 1 → * J, como exportaban versiones viejas de esta
 * herramienta), se la marca como clase asociación de la N:M y se descartan esas dos relaciones
 * sueltas: así no se genera una intermedia duplicada. Función pura.
 */
final class XmiIntermedias {

    private XmiIntermedias() {
    }

    static List<AsociacionXmi> resolver(ModeloXmi modelo) {
        List<AsociacionXmi> resultado = new ArrayList<>(modelo.asociaciones());
        for (AsociacionXmi mn : modelo.asociaciones()) {
            if (mn.claseAsociacionId() != null || !esMuchosAMuchos(mn)) continue;
            for (ClaseXmi j : modelo.clases()) {
                Optional<AsociacionXmi> ladoA = fisica(resultado, mn.origen().claseId(), j.id());
                Optional<AsociacionXmi> ladoB = fisica(resultado, mn.destino().claseId(), j.id());
                if (ladoA.isEmpty() || ladoB.isEmpty() || ladoA.get() == ladoB.get()) continue;
                resultado.remove(ladoA.get());
                resultado.remove(ladoB.get());
                resultado.set(resultado.indexOf(mn), new AsociacionXmi(mn.origen(), mn.destino(), j.id()));
                break;
            }
        }
        return resultado;
    }

    /** Nombres "a_b" de las intermedias que generará el proyecto (N:M sin clase asociación). */
    static List<String> nombresGenerados(ModeloXmi modelo) {
        java.util.Map<String, String> nombres = new java.util.HashMap<>();
        modelo.clases().forEach(c -> nombres.put(c.id(), c.nombre()));
        return resolver(modelo).stream()
                .filter(a -> a.claseAsociacionId() == null && esMuchosAMuchos(a))
                .filter(a -> nombres.containsKey(a.origen().claseId()) && nombres.containsKey(a.destino().claseId()))
                .map(a -> nombres.get(a.origen().claseId()) + "_" + nombres.get(a.destino().claseId()))
                .toList();
    }

    static boolean esMuchosAMuchos(AsociacionXmi a) {
        Multiplicidad o = XmiMapeoEA.parsearMultiplicidad(a.origen().multiplicidad());
        Multiplicidad d = XmiMapeoEA.parsearMultiplicidad(a.destino().multiplicidad());
        return o != null && d != null && !o.esUno() && !d.esUno();
    }

    /** Relación "física" lado → J: el lado con tope 1 y J con tope muchos, en cualquier orden de extremos. */
    private static Optional<AsociacionXmi> fisica(List<AsociacionXmi> asociaciones, String ladoId, String jId) {
        if (ladoId.equals(jId)) return Optional.empty();
        return asociaciones.stream().filter(a -> a.claseAsociacionId() == null).filter(a -> {
            boolean directa = a.origen().claseId().equals(ladoId) && a.destino().claseId().equals(jId);
            boolean inversa = a.origen().claseId().equals(jId) && a.destino().claseId().equals(ladoId);
            if (!directa && !inversa) return false;
            Multiplicidad lado = XmiMapeoEA.parsearMultiplicidad(directa ? a.origen().multiplicidad() : a.destino().multiplicidad());
            Multiplicidad junction = XmiMapeoEA.parsearMultiplicidad(directa ? a.destino().multiplicidad() : a.origen().multiplicidad());
            return lado != null && junction != null && lado.esUno() && !junction.esUno();
        }).findFirst();
    }
}
