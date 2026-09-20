package com.casetool.backend.modules.diagrama.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.casetool.backend.modules.diagrama.model.AtributoEntidad;

public interface AtributoEntidadRepository extends JpaRepository<AtributoEntidad, Long> {

    List<AtributoEntidad> findByEntidadId(Long entidadId);

    @Query("SELECT a FROM AtributoEntidad a WHERE a.entidad.proyecto.id = :proyectoId")
    List<AtributoEntidad> findByProyectoId(@Param("proyectoId") Long proyectoId);

    boolean existsByEntidadIdAndNombre(Long entidadId, String nombre);

    /**
     * Rompe las referencias FK (referencia_entidad_id) hacia entidades de este
     * proyecto antes de borrarlo. Necesario porque esa FK es RESTRICT (a
     * propósito, para bloquear el borrado de UNA entidad todavía referenciada) —
     * pero Postgres chequea esa restricción al vuelo durante una cascada, sin
     * saber que el resto de las filas involucradas se van a borrar en el mismo
     * delete. Sin esto, borrar el proyecto entero fallaría igual que borrar una
     * sola entidad referenciada.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE AtributoEntidad a SET a.referenciaEntidad = null WHERE a.referenciaEntidad.proyecto.id = :proyectoId")
    void limpiarReferenciasDeProyecto(@Param("proyectoId") Long proyectoId);
}
