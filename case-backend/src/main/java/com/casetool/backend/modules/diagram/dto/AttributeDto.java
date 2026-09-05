package com.casetool.backend.modules.diagram.dto;

import com.casetool.backend.modules.diagram.EntityAttribute;

import jakarta.validation.constraints.NotBlank;

public record AttributeDto(
        @NotBlank String name,
        @NotBlank String dataType,
        boolean primaryKey,
        boolean foreignKey,
        boolean nullable) {

    public static AttributeDto from(EntityAttribute attribute) {
        return new AttributeDto(
                attribute.getName(),
                attribute.getDataType(),
                attribute.isPrimaryKey(),
                attribute.isForeignKey(),
                attribute.isNullable());
    }

    public EntityAttribute toEntity() {
        return new EntityAttribute(name(), dataType(), primaryKey(), foreignKey(), nullable());
    }
}
