package com.casetool.backend.modules.diagram;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.diagram.dto.DiagramEntityRequest;
import com.casetool.backend.modules.diagram.dto.DiagramEntityResponse;
import com.casetool.backend.modules.diagram.dto.DiagramRelationRequest;
import com.casetool.backend.modules.diagram.dto.DiagramRelationResponse;
import com.casetool.backend.modules.diagram.dto.DiagramResponse;

import jakarta.validation.Valid;

@RestController
public class DiagramController {

    private final DiagramService diagramService;

    public DiagramController(DiagramService diagramService) {
        this.diagramService = diagramService;
    }

    @GetMapping("/api/projects/{projectId}/diagram")
    public DiagramResponse loadDiagram(@PathVariable Long projectId) {
        return diagramService.loadDiagram(projectId);
    }

    @PostMapping("/api/projects/{projectId}/entities")
    public ResponseEntity<DiagramEntityResponse> createEntity(@PathVariable Long projectId,
            @Valid @RequestBody DiagramEntityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(diagramService.createEntity(projectId, request));
    }

    @PutMapping("/api/entities/{entityId}")
    public DiagramEntityResponse updateEntity(@PathVariable Long entityId,
            @Valid @RequestBody DiagramEntityRequest request) {
        return diagramService.updateEntity(entityId, request);
    }

    @DeleteMapping("/api/entities/{entityId}")
    public ResponseEntity<Void> deleteEntity(@PathVariable Long entityId) {
        diagramService.deleteEntity(entityId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/projects/{projectId}/relations")
    public ResponseEntity<DiagramRelationResponse> createRelation(@PathVariable Long projectId,
            @Valid @RequestBody DiagramRelationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(diagramService.createRelation(projectId, request));
    }

    @PutMapping("/api/relations/{relationId}")
    public DiagramRelationResponse updateRelation(@PathVariable Long relationId,
            @Valid @RequestBody DiagramRelationRequest request) {
        return diagramService.updateRelation(relationId, request);
    }

    @DeleteMapping("/api/relations/{relationId}")
    public ResponseEntity<Void> deleteRelation(@PathVariable Long relationId) {
        diagramService.deleteRelation(relationId);
        return ResponseEntity.noContent().build();
    }
}
