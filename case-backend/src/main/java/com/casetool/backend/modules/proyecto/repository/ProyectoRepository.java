package com.casetool.backend.modules.proyecto.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.proyecto.model.Proyecto;

public interface ProyectoRepository extends JpaRepository<Proyecto, Long> {
}
