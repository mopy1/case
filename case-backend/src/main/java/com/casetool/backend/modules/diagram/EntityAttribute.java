package com.casetool.backend.modules.diagram;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EntityAttribute {

    @Column(nullable = false)
    private String name;

    @Column(name = "data_type", nullable = false)
    private String dataType;

    @Column(name = "is_primary_key", nullable = false)
    private boolean primaryKey;

    @Column(name = "is_foreign_key", nullable = false)
    private boolean foreignKey;

    @Column(name = "is_nullable", nullable = false)
    private boolean nullable;
}
