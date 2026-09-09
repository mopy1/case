package com.casetool.backend.modules.diagrama.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;

public interface EntidadDiagramaRepository extends JpaRepository<EntidadDiagrama, Long> {

    List<EntidadDiagrama> findByProyectoId(Long proyectoId);

    boolean existsByProyectoIdAndNombre(Long proyectoId, String nombre);
}
