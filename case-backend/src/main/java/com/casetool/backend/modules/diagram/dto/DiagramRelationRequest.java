package com.casetool.backend.modules.diagram.dto;

import com.casetool.backend.modules.diagram.RelationType;

import jakarta.validation.constraints.NotNull;

public record DiagramRelationRequest(
        @NotNull Long sourceEntityId,
        @NotNull Long targetEntityId,
        @NotNull RelationType relationType,
        String foreignKeyName) {
}
