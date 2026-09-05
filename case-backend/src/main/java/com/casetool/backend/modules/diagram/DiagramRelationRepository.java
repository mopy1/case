package com.casetool.backend.modules.diagram;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DiagramRelationRepository extends JpaRepository<DiagramRelation, Long> {
    List<DiagramRelation> findByProjectId(Long projectId);
}
