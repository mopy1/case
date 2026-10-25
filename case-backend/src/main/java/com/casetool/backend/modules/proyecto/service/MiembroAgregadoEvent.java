package com.casetool.backend.modules.proyecto.service;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;

/** Se publica al agregar un miembro; el módulo chat lo escucha (proyecto no conoce al chat). */
public record MiembroAgregadoEvent(Long proyectoId, String username, MiembroProyecto.Rol rol) {
}
