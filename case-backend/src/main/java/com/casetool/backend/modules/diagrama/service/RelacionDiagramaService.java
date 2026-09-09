package com.casetool.backend.modules.diagrama.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;
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
    private final ProyectoAccesoService accesoService;

    public RelacionDiagramaService(
            RelacionDiagramaRepository relacionDiagramaRepository,
            ProyectoRepository proyectoRepository,
            EntidadDiagramaService entidadDiagramaService,
            ProyectoAccesoService accesoService) {
        this.relacionDiagramaRepository = relacionDiagramaRepository;
        this.proyectoRepository = proyectoRepository;
        this.entidadDiagramaService = entidadDiagramaService;
        this.accesoService = accesoService;
    }

    public RelacionDiagramaResponse crear(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
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
        relacion.setTipoRelacion(request.tipoRelacion());
        relacionDiagramaRepository.save(relacion);

        return RelacionDiagramaResponse.from(relacion);
    }

    public void eliminar(Long relacionId, Long usuarioId) {
        RelacionDiagrama relacion = relacionDiagramaRepository.findById(relacionId)
                .orElseThrow(() -> new ResourceNotFoundException("Relación no encontrada"));
        MiembroProyecto miembro = accesoService.verificarMiembro(relacion.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        relacionDiagramaRepository.delete(relacion);
    }

    private void verificarPertenecenAlProyecto(Long proyectoId, EntidadDiagrama origen, EntidadDiagrama destino) {
        if (!origen.getProyecto().getId().equals(proyectoId) || !destino.getProyecto().getId().equals(proyectoId)) {
            throw new IllegalArgumentException("Las entidades de la relación deben pertenecer a este proyecto");
        }
    }
}
