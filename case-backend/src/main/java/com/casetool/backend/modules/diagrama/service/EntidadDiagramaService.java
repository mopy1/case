package com.casetool.backend.modules.diagrama.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.exception.NombreDuplicadoDiagramaException;
import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;
import com.casetool.backend.modules.diagrama.repository.AtributoEntidadRepository;
import com.casetool.backend.modules.diagrama.repository.EntidadDiagramaRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional
public class EntidadDiagramaService {

    private final EntidadDiagramaRepository entidadDiagramaRepository;
    private final AtributoEntidadRepository atributoEntidadRepository;
    private final ProyectoRepository proyectoRepository;
    private final ProyectoAccesoService accesoService;

    public EntidadDiagramaService(
            EntidadDiagramaRepository entidadDiagramaRepository,
            AtributoEntidadRepository atributoEntidadRepository,
            ProyectoRepository proyectoRepository,
            ProyectoAccesoService accesoService) {
        this.entidadDiagramaRepository = entidadDiagramaRepository;
        this.atributoEntidadRepository = atributoEntidadRepository;
        this.proyectoRepository = proyectoRepository;
        this.accesoService = accesoService;
    }

    public EntidadDiagramaResponse crear(Long proyectoId, EntidadDiagramaRequest request, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        if (entidadDiagramaRepository.existsByProyectoIdAndNombre(proyectoId, request.nombre())) {
            throw new NombreDuplicadoDiagramaException(
                    "Ya existe una entidad llamada '" + request.nombre() + "' en este proyecto");
        }

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));

        EntidadDiagrama entidad = new EntidadDiagrama();
        entidad.setProyecto(proyecto);
        entidad.setNombre(request.nombre());
        entidad.setPosX(request.posX());
        entidad.setPosY(request.posY());
        entidadDiagramaRepository.save(entidad);

        return toResponse(entidad);
    }

    public EntidadDiagramaResponse actualizar(Long entidadId, EntidadDiagramaRequest request, Long usuarioId) {
        EntidadDiagrama entidad = buscarEntidad(entidadId);
        Long proyectoId = entidad.getProyecto().getId();
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        boolean cambiaNombre = !entidad.getNombre().equals(request.nombre());
        if (cambiaNombre && entidadDiagramaRepository.existsByProyectoIdAndNombre(proyectoId, request.nombre())) {
            throw new NombreDuplicadoDiagramaException(
                    "Ya existe una entidad llamada '" + request.nombre() + "' en este proyecto");
        }

        entidad.setNombre(request.nombre());
        entidad.setPosX(request.posX());
        entidad.setPosY(request.posY());

        return toResponse(entidadDiagramaRepository.save(entidad));
    }

    public void eliminar(Long entidadId, Long usuarioId) {
        EntidadDiagrama entidad = buscarEntidad(entidadId);
        MiembroProyecto miembro = accesoService.verificarMiembro(entidad.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        // Cascada real de base de datos: sus atributos y las relaciones donde participa
        // se borran solos (@OnDelete en AtributoEntidad.entidad y en RelacionDiagrama).
        entidadDiagramaRepository.delete(entidad);
    }

    /**
     * Vacía el diagrama completo de un proyecto (todas las entidades, y por cascada real de base
     * de datos sus atributos y relaciones) — usado por el modo "reemplazar" de importación XMI
     * (ver {@code XmiImportService}). Sin chequeo de rol acá a propósito: quien llama esto ya
     * exigió rol ADMIN antes de invocarlo, no hace falta repetirlo.
     */
    public void eliminarTodo(Long proyectoId) {
        atributoEntidadRepository.limpiarReferenciasDeProyecto(proyectoId);
        entidadDiagramaRepository.deleteByProyectoId(proyectoId);
    }

    boolean existeNombre(Long proyectoId, String nombre) {
        return entidadDiagramaRepository.existsByProyectoIdAndNombre(proyectoId, nombre);
    }

    EntidadDiagrama buscarEntidad(Long entidadId) {
        return entidadDiagramaRepository.findById(entidadId)
                .orElseThrow(() -> new ResourceNotFoundException("Entidad de diagrama no encontrada"));
    }

    private EntidadDiagramaResponse toResponse(EntidadDiagrama entidad) {
        List<AtributoEntidadResponse> atributos = atributoEntidadRepository.findByEntidadId(entidad.getId()).stream()
                .map(AtributoEntidadResponse::from)
                .toList();
        return EntidadDiagramaResponse.from(entidad, atributos);
    }
}
