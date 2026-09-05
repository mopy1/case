package com.casetool.backend.modules.project.dto;

import java.time.Instant;

import com.casetool.backend.modules.project.Project;

public record ProjectResponse(
        Long id,
        String name,
        String description,
        Instant createdAt,
        Instant updatedAt) {

    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
