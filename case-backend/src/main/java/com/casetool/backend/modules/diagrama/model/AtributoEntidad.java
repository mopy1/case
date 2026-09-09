package com.casetool.backend.modules.diagrama.model;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.*;
import lombok.*;

/** Una columna de {@link EntidadDiagrama} — nombre, tipo SQL y si es PK/FK. */
@Entity
@Table(name = "entidad_atributos", uniqueConstraints = @UniqueConstraint(columnNames = { "entidad_id", "nombre" }))
@Getter
@Setter
@NoArgsConstructor
public class AtributoEntidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EntidadDiagrama entidad;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "tipo_sql", nullable = false, length = 50)
    private String tipoSql;

    @Column(name = "es_pk", nullable = false)
    private boolean esPk;

    @Column(name = "es_fk", nullable = false)
    private boolean esFk;

    /**
     * A que EntidadDiagrama apunta este atributo cuando es_fk = true. Sin
     * @OnDelete a proposito (a diferencia de "entidad" arriba): borrar la
     * entidad referenciada NO debe borrar este atributo de rebote, tiene que
     * fallar (RESTRICT) hasta que se resuelva la referencia primero.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referencia_entidad_id")
    private EntidadDiagrama referenciaEntidad;

    @Column(nullable = false)
    private boolean nullable;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
