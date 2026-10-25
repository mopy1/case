package com.casetool.backend.modules.chat.repository;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.chat.model.ChatMensaje;

public interface ChatMensajeRepository extends JpaRepository<ChatMensaje, Long> {

  /** Los más recientes primero; el service invierte el orden. */
  @EntityGraph(attributePaths = {"usuario"})
  List<ChatMensaje> findByProyectoIdOrderByCreatedAtDescIdDesc(Long proyectoId, Limit limit);

  /** Página anterior: solo ids menores al más viejo que ya tiene el cliente. */
  @EntityGraph(attributePaths = {"usuario"})
  List<ChatMensaje> findByProyectoIdAndIdLessThanOrderByCreatedAtDescIdDesc(Long proyectoId, Long antesDe, Limit limit);
}
