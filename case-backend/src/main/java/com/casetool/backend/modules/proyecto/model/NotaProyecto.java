package com.casetool.backend.modules.proyecto.model;

import com.casetool.backend.modules.seguridad.model.Usuario;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notas_proyecto")
@Getter
@Setter
@NoArgsConstructor
public class NotaProyecto {
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

  @Column(name = "accion", nullable = false, length = 100)
  private String accion;

  @Column(name = "motivo", columnDefinition = "TEXT")
  private String motivo;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    this.createdAt = Instant.now();
  }
}
