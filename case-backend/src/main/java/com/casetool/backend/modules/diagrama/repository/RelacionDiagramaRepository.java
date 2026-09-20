package com.casetool.backend.modules.diagrama.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;

public interface RelacionDiagramaRepository extends JpaRepository<RelacionDiagrama, Long> {

    @EntityGraph(attributePaths = {"entidadOrigen", "entidadDestino"})
    List<RelacionDiagrama> findByProyectoId(Long proyectoId);
}
