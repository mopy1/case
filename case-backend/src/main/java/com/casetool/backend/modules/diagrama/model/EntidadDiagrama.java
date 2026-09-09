package com.casetool.backend.modules.diagrama.model;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.casetool.backend.modules.proyecto.model.Proyecto;

import jakarta.persistence.*;
import lombok.*;

/** Una "tabla" del diagrama — nodo en el lienzo (@xyflow/react del frontend). */
@Entity
@Table(name = "diagrama_entidades", uniqueConstraints = @UniqueConstraint(columnNames = { "proyecto_id", "nombre" }))
@Getter
@Setter
@NoArgsConstructor
public class EntidadDiagrama {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proyecto_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Proyecto proyecto;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "pos_x", nullable = false)
    private Double posX;

    @Column(name = "pos_y", nullable = false)
    private Double posY;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
