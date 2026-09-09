package com.casetool.backend.modules.proyecto.model;

import com.casetool.backend.modules.seguridad.model.Usuario;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tareas_proyecto")
@Getter
@Setter
@NoArgsConstructor
public class TareaProyecto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "proyecto_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Proyecto proyecto;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "usuario_id")
  private Usuario usuario;

  @Column(name = "titulo", nullable = false, length = 150)
  private String titulo;

  @Column(name = "descripcion", columnDefinition = "TEXT")
  private String descripcion;

  @Enumerated(EnumType.STRING)
  @Column(name = "prioridad", nullable = false, length = 20)
  private Prioridad prioridad;

  @Enumerated(EnumType.STRING)
  @Column(name = "estado", nullable = false, length = 20)
  private Estado estado;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void onCreate() {
    this.createdAt = Instant.now();
  }

  public enum Estado {
    PENDIENTE, EN_PROGRESO, HECHO;
  }

  public enum Prioridad {
    ALTA, MEDIA, BAJA;
  }

}
