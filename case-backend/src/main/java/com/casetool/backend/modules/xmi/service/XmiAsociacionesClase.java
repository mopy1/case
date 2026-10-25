package com.casetool.backend.modules.xmi.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;

/**
 * Detección de "tabla intermedia de N:M" para el export XMI. Misma heurística que
 * `detectarAsociacionesClase` en useDiagramCanvas.ts del frontend — decide qué se exporta como
 * UML:AssociationClass (con sus 3 relaciones colapsadas en una) y qué como UML:Class +
 * UML:Association sueltos. Patrón buscado: una relación N:M entre A y B, más una entidad J con
 * dos relaciones físicas 1 → 1..* (A → J y B → J).
 */
final class XmiAsociacionesClase {

    private XmiAsociacionesClase() {
    }

    record AsociacionClase(
            EntidadDiagramaResponse origen, EntidadDiagramaResponse destino, EntidadDiagramaResponse junction,
            RelacionDiagramaResponse mn, RelacionDiagramaResponse relOrigen, RelacionDiagramaResponse relDestino) {
    }

    static List<AsociacionClase> detectar(DiagramaResponse diagrama) {
        Map<Long, EntidadDiagramaResponse> entidadPorId = diagrama.entidades().stream()
                .collect(Collectors.toMap(EntidadDiagramaResponse::id, e -> e));
        List<AsociacionClase> resultado = new ArrayList<>();

        for (RelacionDiagramaResponse mn : diagrama.relaciones()) {
            if (mn.multiplicidadOrigen().esUno() || mn.multiplicidadDestino().esUno()) continue;

            for (EntidadDiagramaResponse junction : diagrama.entidades()) {
                if (junction.id().equals(mn.entidadOrigenId()) || junction.id().equals(mn.entidadDestinoId())) continue;

                List<RelacionDiagramaResponse> candidatas = diagrama.relaciones().stream()
                        .filter(r -> esFisicaUnoAMuchos(r) && r.entidadDestinoId().equals(junction.id()))
                        .toList();
                RelacionDiagramaResponse relOrigen = candidatas.stream()
                        .filter(r -> r.entidadOrigenId().equals(mn.entidadOrigenId())).findFirst().orElse(null);
                if (relOrigen == null) continue;
                RelacionDiagramaResponse relDestino = candidatas.stream()
                        .filter(r -> r.entidadOrigenId().equals(mn.entidadDestinoId()) && !r.id().equals(relOrigen.id()))
                        .findFirst().orElse(null);
                if (relDestino == null) continue;

                resultado.add(new AsociacionClase(
                        entidadPorId.get(mn.entidadOrigenId()), entidadPorId.get(mn.entidadDestinoId()),
                        junction, mn, relOrigen, relDestino));
                break;
            }
        }
        return resultado;
    }

    private static boolean esFisicaUnoAMuchos(RelacionDiagramaResponse r) {
        return r.multiplicidadOrigen() == Multiplicidad.UNO && r.multiplicidadDestino() == Multiplicidad.UNO_O_MAS;
    }
}
