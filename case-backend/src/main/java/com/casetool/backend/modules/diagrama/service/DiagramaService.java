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

import java.util.List;
import java.util.stream.Collectors;

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

        var entidadesDb = entidadDiagramaRepository.findByProyectoId(proyectoId);
        var atributosDb = atributoEntidadRepository.findByProyectoId(proyectoId);

        var atributosPorEntidad = atributosDb.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getEntidad().getId(),
                        Collectors.mapping(AtributoEntidadResponse::from, Collectors.toList())
                ));

        var entidades = entidadesDb.stream()
                .map(entidad -> {
                    var atributos = atributosPorEntidad.getOrDefault(entidad.getId(), List.of());
                    return EntidadDiagramaResponse.from(entidad, atributos);
                })
                .toList();

        var relaciones = relacionDiagramaRepository.findByProyectoId(proyectoId).stream()
                .map(RelacionDiagramaResponse::from)
                .toList();

        return new DiagramaResponse(entidades, relaciones);
    }
}
