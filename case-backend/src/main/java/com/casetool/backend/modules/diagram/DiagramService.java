package com.casetool.backend.modules.diagram;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagram.dto.DiagramEntityRequest;
import com.casetool.backend.modules.diagram.dto.DiagramEntityResponse;
import com.casetool.backend.modules.diagram.dto.DiagramRelationRequest;
import com.casetool.backend.modules.diagram.dto.DiagramRelationResponse;
import com.casetool.backend.modules.diagram.dto.DiagramResponse;
import com.casetool.backend.modules.project.Project;
import com.casetool.backend.modules.project.ProjectService;

@Service
@Transactional
public class DiagramService {

    private final DiagramEntityRepository entityRepository;
    private final DiagramRelationRepository relationRepository;
    private final ProjectService projectService;

    public DiagramService(DiagramEntityRepository entityRepository,
            DiagramRelationRepository relationRepository,
            ProjectService projectService) {
        this.entityRepository = entityRepository;
        this.relationRepository = relationRepository;
        this.projectService = projectService;
    }

    @Transactional(readOnly = true)
    public DiagramResponse loadDiagram(Long projectId) {
        projectService.getOrThrow(projectId);
        List<DiagramEntityResponse> entities = entityRepository.findByProjectId(projectId).stream()
                .map(DiagramEntityResponse::from).toList();
        List<DiagramRelationResponse> relations = relationRepository.findByProjectId(projectId).stream()
                .map(DiagramRelationResponse::from).toList();
        return new DiagramResponse(projectId, entities, relations);
    }

    public DiagramEntityResponse createEntity(Long projectId, DiagramEntityRequest request) {
        Project project = projectService.getOrThrow(projectId);
        DiagramEntity entity = new DiagramEntity();
        entity.setProject(project);
        applyEntityRequest(entity, request);
        return DiagramEntityResponse.from(entityRepository.save(entity));
    }

    public DiagramEntityResponse updateEntity(Long entityId, DiagramEntityRequest request) {
        DiagramEntity entity = entityRepository.findById(entityId)
                .orElseThrow(() -> ResourceNotFoundException.of("Entidad de diagrama", entityId));
        applyEntityRequest(entity, request);
        return DiagramEntityResponse.from(entityRepository.save(entity));
    }

    public void deleteEntity(Long entityId) {
        if (!entityRepository.existsById(entityId)) {
            throw ResourceNotFoundException.of("Entidad de diagrama", entityId);
        }
        entityRepository.deleteById(entityId);
    }

    public DiagramRelationResponse createRelation(Long projectId, DiagramRelationRequest request) {
        Project project = projectService.getOrThrow(projectId);
        DiagramRelation relation = new DiagramRelation();
        relation.setProject(project);
        applyRelationRequest(relation, request);
        return DiagramRelationResponse.from(relationRepository.save(relation));
    }

    public DiagramRelationResponse updateRelation(Long relationId, DiagramRelationRequest request) {
        DiagramRelation relation = relationRepository.findById(relationId)
                .orElseThrow(() -> ResourceNotFoundException.of("Relacion de diagrama", relationId));
        applyRelationRequest(relation, request);
        return DiagramRelationResponse.from(relationRepository.save(relation));
    }

    public void deleteRelation(Long relationId) {
        if (!relationRepository.existsById(relationId)) {
            throw ResourceNotFoundException.of("Relacion de diagrama", relationId);
        }
        relationRepository.deleteById(relationId);
    }

    private void applyEntityRequest(DiagramEntity entity, DiagramEntityRequest request) {
        entity.setName(request.name());
        entity.setPosX(request.posX());
        entity.setPosY(request.posY());
        entity.getAttributes().clear();
        request.attributes().forEach(dto -> entity.getAttributes().add(dto.toEntity()));
    }

    private void applyRelationRequest(DiagramRelation relation, DiagramRelationRequest request) {
        DiagramEntity source = entityRepository.findById(request.sourceEntityId())
                .orElseThrow(() -> ResourceNotFoundException.of("Entidad de diagrama", request.sourceEntityId()));
        DiagramEntity target = entityRepository.findById(request.targetEntityId())
                .orElseThrow(() -> ResourceNotFoundException.of("Entidad de diagrama", request.targetEntityId()));
        relation.setSourceEntity(source);
        relation.setTargetEntity(target);
        relation.setRelationType(request.relationType());
        relation.setForeignKeyName(request.foreignKeyName());
    }
}
