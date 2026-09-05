package com.casetool.backend.modules.diagram;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DiagramEntityRepository extends JpaRepository<DiagramEntity, Long> {
    List<DiagramEntity> findByProjectId(Long projectId);
}
