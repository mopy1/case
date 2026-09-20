package com.casetool.backend.modules.proyecto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.proyecto.model.TareaProyecto;

public interface TareaProyectoRepository extends JpaRepository<TareaProyecto, Long> {

  @EntityGraph(attributePaths = {"usuario"})
  List<TareaProyecto> findByProyectoIdOrderByCreatedAtDesc(Long proyectoId);
}
