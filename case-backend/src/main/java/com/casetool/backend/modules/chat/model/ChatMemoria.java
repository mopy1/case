package com.casetool.backend.modules.chat.model;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.casetool.backend.modules.proyecto.model.Proyecto;

import jakarta.persistence.*;
import lombok.*;

/**
 * Memoria de largo plazo de Senior Dev: un resumen acumulado por proyecto (PK = FK a proyectos).
 * {@code ultimoMensajeResumidoId} es una marca de agua numérica ("resumí hasta el id N"), no una FK.
 */
@Entity
@Table(name = "chat_memoria")
@Getter
@Setter
@NoArgsConstructor
public class ChatMemoria {

  @Id
  @Column(name = "proyecto_id")
  private Long proyectoId;

  @MapsId
  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "proyecto_id")
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Proyecto proyecto;

  @Column(name = "resumen", nullable = false, columnDefinition = "TEXT")
  private String resumen;

  @Column(name = "ultimo_mensaje_resumido_id", nullable = false)
  private Long ultimoMensajeResumidoId;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PrePersist
  @PreUpdate
  void tocar() {
    this.updatedAt = Instant.now();
  }
}
