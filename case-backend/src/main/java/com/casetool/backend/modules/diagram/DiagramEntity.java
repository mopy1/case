package com.casetool.backend.modules.diagram;

import java.util.ArrayList;
import java.util.List;

import com.casetool.backend.modules.project.Project;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "diagram_entities")
@Getter
@Setter
@NoArgsConstructor
public class DiagramEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column(name = "pos_x", nullable = false)
    private double posX;

    @Column(name = "pos_y", nullable = false)
    private double posY;

    @ElementCollection
    @CollectionTable(name = "diagram_entity_attributes", joinColumns = @JoinColumn(name = "entity_id"))
    @OrderColumn(name = "attribute_order")
    private List<EntityAttribute> attributes = new ArrayList<>();
}
