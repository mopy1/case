package com.casetool.backend.modules.proyecto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.proyecto.model.NotaProyecto;

public interface NotaProyectoRepository extends JpaRepository<NotaProyecto, Long> {

  @EntityGraph(attributePaths = {"usuario"})
  List<NotaProyecto> findByProyectoIdOrderByCreatedAtDesc(Long proyectoId);
}
