package com.casetool.backend.modules.diagram.dto;

import java.util.List;

import com.casetool.backend.modules.diagram.DiagramEntity;

public record DiagramEntityResponse(
        Long id,
        String name,
        double posX,
        double posY,
        List<AttributeDto> attributes) {

    public static DiagramEntityResponse from(DiagramEntity entity) {
        return new DiagramEntityResponse(
                entity.getId(),
                entity.getName(),
                entity.getPosX(),
                entity.getPosY(),
                entity.getAttributes().stream().map(AttributeDto::from).toList());
    }
}
