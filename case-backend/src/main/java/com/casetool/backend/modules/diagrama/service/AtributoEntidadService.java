package com.casetool.backend.modules.diagrama.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.exception.NombreDuplicadoDiagramaException;
import com.casetool.backend.modules.diagrama.model.AtributoEntidad;
import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;
import com.casetool.backend.modules.diagrama.repository.AtributoEntidadRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional
public class AtributoEntidadService {

    private final AtributoEntidadRepository atributoEntidadRepository;
    private final EntidadDiagramaService entidadDiagramaService;
    private final ProyectoAccesoService accesoService;

    public AtributoEntidadService(
            AtributoEntidadRepository atributoEntidadRepository,
            EntidadDiagramaService entidadDiagramaService,
            ProyectoAccesoService accesoService) {
        this.atributoEntidadRepository = atributoEntidadRepository;
        this.entidadDiagramaService = entidadDiagramaService;
        this.accesoService = accesoService;
    }

    public AtributoEntidadResponse agregar(Long entidadId, AtributoEntidadRequest request, Long usuarioId) {
        EntidadDiagrama entidad = entidadDiagramaService.buscarEntidad(entidadId);
        Long proyectoId = entidad.getProyecto().getId();
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        if (atributoEntidadRepository.existsByEntidadIdAndNombre(entidadId, request.nombre())) {
            throw new NombreDuplicadoDiagramaException(
                    "Ya existe un atributo llamado '" + request.nombre() + "' en esta entidad");
        }

        AtributoEntidad atributo = new AtributoEntidad();
        atributo.setEntidad(entidad);
        atributo.setNombre(request.nombre());
        atributo.setTipoSql(request.tipoSql());
        atributo.setEsPk(request.esPk());
        atributo.setEsFk(request.esFk());
        atributo.setNullable(request.nullable());
        atributo.setReferenciaEntidad(resolverReferencia(request, proyectoId));
        atributoEntidadRepository.save(atributo);

        return AtributoEntidadResponse.from(atributo);
    }

    public AtributoEntidadResponse actualizar(Long atributoId, AtributoEntidadRequest request, Long usuarioId) {
        AtributoEntidad atributo = buscarAtributo(atributoId);
        Long proyectoId = atributo.getEntidad().getProyecto().getId();
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        boolean cambiaNombre = !atributo.getNombre().equals(request.nombre());
        if (cambiaNombre
                && atributoEntidadRepository.existsByEntidadIdAndNombre(atributo.getEntidad().getId(), request.nombre())) {
            throw new NombreDuplicadoDiagramaException(
                    "Ya existe un atributo llamado '" + request.nombre() + "' en esta entidad");
        }

        atributo.setNombre(request.nombre());
        atributo.setTipoSql(request.tipoSql());
        atributo.setEsPk(request.esPk());
        atributo.setEsFk(request.esFk());
        atributo.setNullable(request.nullable());
        atributo.setReferenciaEntidad(resolverReferencia(request, proyectoId));

        return AtributoEntidadResponse.from(atributoEntidadRepository.save(atributo));
    }

    public void eliminar(Long atributoId, Long usuarioId) {
        AtributoEntidad atributo = buscarAtributo(atributoId);
        MiembroProyecto miembro = accesoService.verificarMiembro(atributo.getEntidad().getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        atributoEntidadRepository.delete(atributo);
    }

    private AtributoEntidad buscarAtributo(Long atributoId) {
        return atributoEntidadRepository.findById(atributoId)
                .orElseThrow(() -> new ResourceNotFoundException("Atributo no encontrado"));
    }

    /** Si es_fk viene en true, valida que la referencia exista y sea del mismo proyecto. */
    private EntidadDiagrama resolverReferencia(AtributoEntidadRequest request, Long proyectoId) {
        if (!Boolean.TRUE.equals(request.esFk())) {
            return null;
        }
        if (request.referenciaEntidadId() == null) {
            throw new IllegalArgumentException("Un atributo FK necesita indicar a qué entidad hace referencia");
        }
        EntidadDiagrama referencia = entidadDiagramaService.buscarEntidad(request.referenciaEntidadId());
        if (!referencia.getProyecto().getId().equals(proyectoId)) {
            throw new IllegalArgumentException("La entidad de referencia no pertenece a este proyecto");
        }
        return referencia;
    }
}
