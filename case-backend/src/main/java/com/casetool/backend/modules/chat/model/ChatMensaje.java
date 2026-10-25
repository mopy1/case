package com.casetool.backend.modules.chat.model;

import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.seguridad.model.Usuario;

import java.time.Instant;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_mensajes",
    indexes = @Index(name = "idx_chat_mensajes_proyecto_created", columnList = "proyecto_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
public class ChatMensaje {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "proyecto_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Proyecto proyecto;

  /** Autor humano; null cuando el mensaje es de la IA o del sistema. */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "usuario_id")
  private Usuario usuario;

  @Enumerated(EnumType.STRING)
  @Column(name = "tipo", nullable = false, length = 20)
  private Tipo tipo;

  @Column(name = "contenido", nullable = false, columnDefinition = "TEXT")
  private String contenido;

  /** Mensaje al que responde (lo usa F2 para el hilo de la IA); en F1 siempre null. */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "respuesta_a_id")
  @OnDelete(action = OnDeleteAction.SET_NULL)
  private ChatMensaje respuestaA;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "propuesta_aplicada", nullable = false, columnDefinition = "boolean default false")
  private boolean propuestaAplicada = false;

  @Column(name = "aplicado_por", length = 100)
  private String aplicadoPor;

  @PrePersist
  void onCreate() {
    this.createdAt = Instant.now();
  }

  /** Los 3 valores van desde F1: el CHECK que genera Hibernate no se actualiza con ddl-auto=update. */
  public enum Tipo {
    USUARIO, IA, SISTEMA;
  }
}
