package com.casetool.backend.modules.diagram.dto;

import com.casetool.backend.modules.diagram.DiagramRelation;
import com.casetool.backend.modules.diagram.RelationType;

public record DiagramRelationResponse(
        Long id,
        Long sourceEntityId,
        Long targetEntityId,
        RelationType relationType,
        String foreignKeyName) {

    public static DiagramRelationResponse from(DiagramRelation relation) {
        return new DiagramRelationResponse(
                relation.getId(),
                relation.getSourceEntity().getId(),
                relation.getTargetEntity().getId(),
                relation.getRelationType(),
                relation.getForeignKeyName());
    }
}
