package com.casetool.backend.modules.xmi.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;
import com.casetool.backend.modules.diagrama.service.RelacionDiagramaService;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.GeneralizacionXmi;

/**
 * Relaciones de un import, con el mismo resultado que dibujarlas en el lienzo:
 * <ul>
 *   <li><b>N:M sin clase asociación</b> → {@link RelacionDiagramaService#crear}: genera la tabla intermedia
 *       "a_b" con sus FK, igual que en el lienzo.</li>
 *   <li><b>Con clase asociación J</b> (línea punteada de EA) → J es la intermedia: N:M abstracta A–B + dos
 *       relaciones físicas A 1 → 1..* J y B 1 → 1..* J (el patrón que el lienzo dibuja como clase asociación).
 *       Sin multiplicidades en el archivo se asume N:M.</li>
 *   <li>Resto → relación tal cual; una punta sin multiplicidad se toma como "1".</li>
 * </ul>
 */
@Component
class XmiRelacionesImport {

    private final RelacionDiagramaService relaciones;

    XmiRelacionesImport(RelacionDiagramaService relaciones) {
        this.relaciones = relaciones;
    }

    /** @return cuántas tablas intermedias generó el proyecto (las N:M sin clase asociación). */
    int crear(Long proyectoId, List<AsociacionXmi> asociaciones, List<GeneralizacionXmi> generalizaciones,
            Map<String, Long> idPorXmiId, Long usuarioId) {
        int generadas = 0;
        for (AsociacionXmi a : asociaciones) {
            Long origen = idPorXmiId.get(a.origen().claseId());
            Long destino = idPorXmiId.get(a.destino().claseId());
            if (origen == null || destino == null) continue;
            Long junction = a.claseAsociacionId() != null ? idPorXmiId.get(a.claseAsociacionId()) : null;
            generadas += junction != null
                    ? conClaseAsociacion(proyectoId, a, origen, destino, junction, usuarioId)
                    : simple(proyectoId, a, origen, destino, usuarioId);
        }
        for (GeneralizacionXmi g : generalizaciones) {
            Long hijo = idPorXmiId.get(g.hijoId());
            Long padre = idPorXmiId.get(g.padreId());
            if (hijo == null || padre == null) continue;
            relaciones.crearSinTablaIntermedia(proyectoId, new RelacionDiagramaRequest(
                    hijo, padre, Multiplicidad.UNO, Multiplicidad.UNO, TipoRelacionUml.HERENCIA), usuarioId);
        }
        return generadas;
    }

    private int simple(Long proyectoId, AsociacionXmi a, Long origen, Long destino, Long usuarioId) {
        RelacionDiagramaRequest req = new RelacionDiagramaRequest(origen, destino,
                multiplicidad(a.origen().multiplicidad(), Multiplicidad.UNO),
                multiplicidad(a.destino().multiplicidad(), Multiplicidad.UNO),
                XmiMapeoEA.tipoDesdeAggregation(a.origen().agregacion(), a.destino().agregacion()));
        boolean muchosAMuchos = !req.multiplicidadOrigen().esUno() && !req.multiplicidadDestino().esUno();
        if (muchosAMuchos && req.tipo() == TipoRelacionUml.ASOCIACION) {
            relaciones.crear(proyectoId, req, usuarioId);
            return 1;
        }
        relaciones.crearSinTablaIntermedia(proyectoId, req, usuarioId);
        return 0;
    }

    private int conClaseAsociacion(Long proyectoId, AsociacionXmi a, Long origen, Long destino, Long junction, Long usuarioId) {
        relaciones.crearSinTablaIntermedia(proyectoId, new RelacionDiagramaRequest(origen, destino,
                multiplicidad(a.origen().multiplicidad(), Multiplicidad.CERO_O_MAS),
                multiplicidad(a.destino().multiplicidad(), Multiplicidad.CERO_O_MAS)), usuarioId);
        relaciones.crearSinTablaIntermedia(proyectoId,
                new RelacionDiagramaRequest(origen, junction, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS), usuarioId);
        relaciones.crearSinTablaIntermedia(proyectoId,
                new RelacionDiagramaRequest(destino, junction, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS), usuarioId);
        return 0;
    }

    private static Multiplicidad multiplicidad(String texto, Multiplicidad porDefecto) {
        Multiplicidad m = XmiMapeoEA.parsearMultiplicidad(texto);
        return m != null ? m : porDefecto;
    }
}
