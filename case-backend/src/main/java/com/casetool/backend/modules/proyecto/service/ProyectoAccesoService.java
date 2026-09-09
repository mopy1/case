package com.casetool.backend.modules.proyecto.service;

import org.springframework.stereotype.Service;

import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.exception.RolInsuficienteProyectoException;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;

/**
 * Chequeos de membresia/rol compartidos por todos los services de
 * {@code modules/proyecto}. Existe para no repetir la misma logica de
 * autorizacion (y el mismo riesgo de que se desincronice) en cada service.
 */
@Service
public class ProyectoAccesoService {

    private final MiembroProyectoRepository miembroProyectoRepository;

    public ProyectoAccesoService(MiembroProyectoRepository miembroProyectoRepository) {
        this.miembroProyectoRepository = miembroProyectoRepository;
    }

    public MiembroProyecto verificarMiembro(Long proyectoId, Long usuarioId) {
        return miembroProyectoRepository.findByProyectoIdAndUsuarioId(proyectoId, usuarioId)
                .orElseThrow(() -> new AccesoDenegadoProyectoException("No sos colaborador de este proyecto"));
    }

    public void verificarPuedeEscribir(MiembroProyecto miembro) {
        if (miembro.getRol() == MiembroProyecto.Rol.LECTOR) {
            throw new RolInsuficienteProyectoException("Los lectores no pueden modificar el proyecto");
        }
    }

    public void verificarRolAdmin(MiembroProyecto miembro) {
        if (miembro.getRol() != MiembroProyecto.Rol.ADMIN) {
            throw new RolInsuficienteProyectoException("Se necesita rol ADMIN para esta acción");
        }
    }

    public void verificarEsMiembroDelProyecto(Long proyectoId, Long usuarioId) {
        if (!miembroProyectoRepository.existsByProyectoIdAndUsuarioId(proyectoId, usuarioId)) {
            throw new AccesoDenegadoProyectoException("Ese usuario no es colaborador de este proyecto");
        }
    }

    /** Impide dejar un proyecto sin ningun ADMIN (al degradar o quitar al ultimo). */
    public void verificarNoEsUltimoAdmin(Long proyectoId, MiembroProyecto objetivo) {
        if (objetivo.getRol() != MiembroProyecto.Rol.ADMIN) {
            return;
        }
        long admins = miembroProyectoRepository.findByProyectoId(proyectoId).stream()
                .filter(m -> m.getRol() == MiembroProyecto.Rol.ADMIN)
                .count();
        if (admins <= 1) {
            throw new RolInsuficienteProyectoException("No se puede quitar/degradar al único ADMIN del proyecto");
        }
    }
}
