package com.casetool.backend.modules.proyecto.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.proyecto.model.TareaProyecto;

public interface TareaProyectoRepository extends JpaRepository<TareaProyecto, Long> {

  List<TareaProyecto> findByProyectoIdOrderByCreatedAtDesc(Long proyectoId);
}
