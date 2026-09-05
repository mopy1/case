package com.casetool.backend.modules.diagram.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DiagramEntityRequest(
        @NotBlank String name,
        double posX,
        double posY,
        @NotNull @Valid List<AttributeDto> attributes) {
}
