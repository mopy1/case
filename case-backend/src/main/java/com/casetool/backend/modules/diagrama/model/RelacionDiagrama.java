package com.casetool.backend.modules.diagrama.model;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.casetool.backend.modules.proyecto.model.Proyecto;

import jakarta.persistence.*;
import lombok.*;

/** Una conexion entre dos {@link EntidadDiagrama} — arista (Edge) en el lienzo. */
@Entity
@Table(name = "diagrama_relaciones")
@Getter
@Setter
@NoArgsConstructor
public class RelacionDiagrama {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proyecto_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Proyecto proyecto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_origen_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EntidadDiagrama entidadOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_destino_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EntidadDiagrama entidadDestino;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_relacion", nullable = false, length = 20)
    private TipoRelacion tipoRelacion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public enum TipoRelacion {
        UNO_A_UNO, UNO_A_MUCHOS, MUCHOS_A_MUCHOS;
    }
}
