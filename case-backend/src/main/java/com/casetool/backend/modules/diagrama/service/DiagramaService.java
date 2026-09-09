package com.casetool.backend.modules.diagrama.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.repository.AtributoEntidadRepository;
import com.casetool.backend.modules.diagrama.repository.EntidadDiagramaRepository;
import com.casetool.backend.modules.diagrama.repository.RelacionDiagramaRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional(readOnly = true)
public class DiagramaService {

    private final EntidadDiagramaRepository entidadDiagramaRepository;
    private final AtributoEntidadRepository atributoEntidadRepository;
    private final RelacionDiagramaRepository relacionDiagramaRepository;
    private final ProyectoAccesoService accesoService;

    public DiagramaService(
            EntidadDiagramaRepository entidadDiagramaRepository,
            AtributoEntidadRepository atributoEntidadRepository,
            RelacionDiagramaRepository relacionDiagramaRepository,
            ProyectoAccesoService accesoService) {
        this.entidadDiagramaRepository = entidadDiagramaRepository;
        this.atributoEntidadRepository = atributoEntidadRepository;
        this.relacionDiagramaRepository = relacionDiagramaRepository;
        this.accesoService = accesoService;
    }

    /** Trae el lienzo completo de un proyecto — cualquier miembro puede verlo, hasta LECTOR. */
    public DiagramaResponse obtenerDiagrama(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);

        var entidades = entidadDiagramaRepository.findByProyectoId(proyectoId).stream()
                .map(entidad -> {
                    var atributos = atributoEntidadRepository.findByEntidadId(entidad.getId()).stream()
                            .map(AtributoEntidadResponse::from)
                            .toList();
                    return EntidadDiagramaResponse.from(entidad, atributos);
                })
                .toList();

        var relaciones = relacionDiagramaRepository.findByProyectoId(proyectoId).stream()
                .map(RelacionDiagramaResponse::from)
                .toList();

        return new DiagramaResponse(entidades, relaciones);
    }
}
