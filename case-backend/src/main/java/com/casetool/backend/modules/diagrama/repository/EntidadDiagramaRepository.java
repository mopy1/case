package com.casetool.backend.modules.diagrama.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;

public interface EntidadDiagramaRepository extends JpaRepository<EntidadDiagrama, Long> {

    List<EntidadDiagrama> findByProyectoId(Long proyectoId);

    boolean existsByProyectoIdAndNombre(Long proyectoId, String nombre);

    /**
     * Borra todas las entidades de un proyecto de una — usado por el modo "reemplazar" de
     * importación XMI (ver {@code XmiImportService}). Igual que en {@code ProyectoService#eliminar},
     * llamar primero a {@code AtributoEntidadRepository#limpiarReferenciasDeProyecto} — la FK
     * `referencia_entidad_id` es RESTRICT a propósito, Postgres la chequea al vuelo durante la
     * cascada sin saber que todo el árbol se borra en el mismo delete.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM EntidadDiagrama e WHERE e.proyecto.id = :proyectoId")
    void deleteByProyectoId(@Param("proyectoId") Long proyectoId);
}
