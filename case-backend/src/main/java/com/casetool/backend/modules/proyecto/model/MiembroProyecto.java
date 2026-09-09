package com.casetool.backend.modules.proyecto.model;

import com.casetool.backend.modules.seguridad.model.Usuario;
import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "miembros_proyecto", uniqueConstraints = @UniqueConstraint(columnNames = { "proyecto_id", "usuario_id" }))
@Getter
@Setter
@NoArgsConstructor
public class MiembroProyecto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "proyecto_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Proyecto proyecto;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "usuario_id", nullable = false)
  private Usuario usuario;

  @Enumerated(EnumType.STRING)
  @Column(name = "rol", nullable = false, length = 20)
  private Rol rol;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    this.createdAt = Instant.now();
  }

  public enum Rol {
    ADMIN, COLABORADOR, LECTOR;
  }
}
