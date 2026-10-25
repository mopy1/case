package com.casetool.backend.modules.diagrama.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.ActualizarPuntosControlRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;
import com.casetool.backend.modules.diagrama.model.PuntoControl;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.repository.RelacionDiagramaRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional
public class RelacionDiagramaService {

    private final RelacionDiagramaRepository relacionDiagramaRepository;
    private final ProyectoRepository proyectoRepository;
    private final EntidadDiagramaService entidadDiagramaService;
    private final TablaIntermediaService tablaIntermediaService;
    private final ProyectoAccesoService accesoService;

    public RelacionDiagramaService(
            RelacionDiagramaRepository relacionDiagramaRepository,
            ProyectoRepository proyectoRepository,
            EntidadDiagramaService entidadDiagramaService,
            TablaIntermediaService tablaIntermediaService,
            ProyectoAccesoService accesoService) {
        this.relacionDiagramaRepository = relacionDiagramaRepository;
        this.proyectoRepository = proyectoRepository;
        this.entidadDiagramaService = entidadDiagramaService;
        this.tablaIntermediaService = tablaIntermediaService;
        this.accesoService = accesoService;
    }

    public RelacionDiagramaResponse crear(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        RelacionDiagrama relacion = crearRelacionCruda(proyectoId, request, usuarioId);

        if (relacion.esMuchosAMuchos()) {
            tablaIntermediaService.crearTablaIntermedia(proyectoId, relacion.getProyecto(),
                    relacion.getEntidadOrigen(), relacion.getEntidadDestino(), usuarioId);
        }

        return RelacionDiagramaResponse.from(relacion);
    }

    /**
     * Igual que {@link #crear} pero sin auto-crear la tabla intermedia — lo usa la importación XMI:
     * el archivo ya trae la tabla intermedia y sus 2 relaciones físicas, recrearlas la duplicaría.
     */
    public RelacionDiagramaResponse crearSinTablaIntermedia(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        return RelacionDiagramaResponse.from(crearRelacionCruda(proyectoId, request, usuarioId));
    }

    private RelacionDiagrama crearRelacionCruda(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));

        EntidadDiagrama origen = entidadDiagramaService.buscarEntidad(request.entidadOrigenId());
        EntidadDiagrama destino = entidadDiagramaService.buscarEntidad(request.entidadDestinoId());
        verificarPertenecenAlProyecto(proyectoId, origen, destino);

        RelacionDiagrama relacion = new RelacionDiagrama();
        relacion.setProyecto(proyecto);
        relacion.setEntidadOrigen(origen);
        relacion.setEntidadDestino(destino);
        relacion.setMultiplicidadOrigen(request.multiplicidadOrigen());
        relacion.setMultiplicidadDestino(request.multiplicidadDestino());
        relacion.setTipo(request.tipo() != null ? request.tipo() : RelacionDiagrama.TipoRelacionUml.ASOCIACION);
        relacionDiagramaRepository.save(relacion);
        return relacion;
    }

    /**
     * Edita una relación existente. Cada punta se edita por separado desde el lienzo, así que una
     * relación puede llegar a N:M de forma incremental. Por eso SÍ crea la tabla intermedia cuando
     * la edición la convierte en N:M y antes no lo era (mismo resultado que crearla N:M de entrada).
     * Si ya era N:M y se guarda de nuevo, no se repite: ya tiene tabla intermedia.
     */
    public RelacionDiagramaResponse actualizar(Long relacionId, RelacionDiagramaRequest request, Long usuarioId) {
        RelacionDiagrama relacion = buscarRelacionEditable(relacionId, usuarioId);
        Long proyectoId = relacion.getProyecto().getId();

        EntidadDiagrama origen = entidadDiagramaService.buscarEntidad(request.entidadOrigenId());
        EntidadDiagrama destino = entidadDiagramaService.buscarEntidad(request.entidadDestinoId());
        verificarPertenecenAlProyecto(proyectoId, origen, destino);

        boolean eraMuchosAMuchos = relacion.esMuchosAMuchos();
        Proyecto proyecto = relacion.getProyecto();

        relacion.setEntidadOrigen(origen);
        relacion.setEntidadDestino(destino);
        relacion.setMultiplicidadOrigen(request.multiplicidadOrigen());
        relacion.setMultiplicidadDestino(request.multiplicidadDestino());
        if (request.tipo() != null) {
            relacion.setTipo(request.tipo());
        }
        RelacionDiagrama guardada = relacionDiagramaRepository.save(relacion);

        if (guardada.esMuchosAMuchos() && !eraMuchosAMuchos) {
            tablaIntermediaService.crearTablaIntermedia(proyectoId, proyecto, origen, destino, usuarioId);
        }

        return RelacionDiagramaResponse.from(guardada);
    }

    /** Reemplaza la lista completa de puntos de control — el frontend manda siempre la lista
     * entera (agregar/mover/quitar un punto es la misma operación acá). */
    public RelacionDiagramaResponse actualizarPuntosControl(Long relacionId, ActualizarPuntosControlRequest request, Long usuarioId) {
        RelacionDiagrama relacion = buscarRelacionEditable(relacionId, usuarioId);
        List<PuntoControl> puntos = request.puntos().stream()
                .map(p -> new PuntoControl(p.x(), p.y()))
                .toList();
        relacion.setPuntosControl(puntos);
        relacionDiagramaRepository.save(relacion);
        return RelacionDiagramaResponse.from(relacion);
    }

    public void eliminar(Long relacionId, Long usuarioId) {
        RelacionDiagrama relacion = buscarRelacionEditable(relacionId, usuarioId);
        relacionDiagramaRepository.delete(relacion);
    }

    private void verificarPertenecenAlProyecto(Long proyectoId, EntidadDiagrama origen, EntidadDiagrama destino) {
        if (!origen.getProyecto().getId().equals(proyectoId) || !destino.getProyecto().getId().equals(proyectoId)) {
            throw new IllegalArgumentException("Las entidades de la relación deben pertenecer a este proyecto");
        }
    }

    /** Busca la relación y exige que el usuario sea miembro con permiso de escritura (no LECTOR). */
    private RelacionDiagrama buscarRelacionEditable(Long relacionId, Long usuarioId) {
        RelacionDiagrama relacion = relacionDiagramaRepository.findById(relacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Relación no encontrada"));
        MiembroProyecto miembro = accesoService.verificarMiembro(relacion.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);
        return relacion;
    }
}
