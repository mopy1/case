package com.casetool.backend.modules.proyecto.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;

public interface MiembroProyectoRepository extends JpaRepository<MiembroProyecto, Long> {

  Optional<MiembroProyecto> findByProyectoIdAndUsuarioId(Long proyectoId, Long usuarioId);

  boolean existsByProyectoIdAndUsuarioId(Long proyectoId, Long usuarioId);

  List<MiembroProyecto> findByProyectoId(Long proyectoId);

  List<MiembroProyecto> findByUsuarioId(Long usuarioId);
}
