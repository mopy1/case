package com.casetool.backend.modules.proyecto.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.repository.AtributoEntidadRepository;
import com.casetool.backend.modules.proyecto.dto.ProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.ProyectoResponse;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@Service
@Transactional
public class ProyectoService {

    private final ProyectoRepository proyectoRepository;
    private final MiembroProyectoRepository miembroProyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoAccesoService accesoService;
    private final AtributoEntidadRepository atributoEntidadRepository;

    public ProyectoService(
            ProyectoRepository proyectoRepository,
            MiembroProyectoRepository miembroProyectoRepository,
            UsuarioRepository usuarioRepository,
            ProyectoAccesoService accesoService,
            AtributoEntidadRepository atributoEntidadRepository) {
        this.proyectoRepository = proyectoRepository;
        this.miembroProyectoRepository = miembroProyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.accesoService = accesoService;
        this.atributoEntidadRepository = atributoEntidadRepository;
    }

    public ProyectoResponse crear(ProyectoRequest request, Long usuarioId) {
        Usuario creador = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        Proyecto proyecto = new Proyecto();
        proyecto.setNombre(request.nombre());
        proyecto.setDescripcion(request.descripcion());
        proyectoRepository.save(proyecto);

        MiembroProyecto admin = new MiembroProyecto();
        admin.setProyecto(proyecto);
        admin.setUsuario(creador);
        admin.setRol(MiembroProyecto.Rol.ADMIN);
        miembroProyectoRepository.save(admin);

        return ProyectoResponse.from(proyecto, MiembroProyecto.Rol.ADMIN);
    }

    @Transactional(readOnly = true)
    public List<ProyectoResponse> listarMisProyectos(Long usuarioId) {
        return miembroProyectoRepository.findByUsuarioId(usuarioId).stream()
                .map(miembro -> ProyectoResponse.from(miembro.getProyecto(), miembro.getRol()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProyectoResponse obtenerPorId(Long proyectoId, Long usuarioId) {
        Proyecto proyecto = buscarProyecto(proyectoId);
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        return ProyectoResponse.from(proyecto, miembro.getRol());
    }

    public ProyectoResponse actualizar(Long proyectoId, ProyectoRequest request, Long usuarioId) {
        Proyecto proyecto = buscarProyecto(proyectoId);
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        proyecto.setNombre(request.nombre());
        proyecto.setDescripcion(request.descripcion());
        proyectoRepository.save(proyecto);

        return ProyectoResponse.from(proyecto, miembro.getRol());
    }

    public void eliminar(Long proyectoId, Long usuarioId) {
        Proyecto proyecto = buscarProyecto(proyectoId);
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        // Rompe primero las referencias FK entre entidades del diagrama (referencia_entidad_id
        // es RESTRICT a propósito — ver AtributoEntidadRepository — y Postgres la chequea al
        // vuelo durante la cascada, sin saber que todo el árbol se borra en el mismo delete).
        atributoEntidadRepository.limpiarReferenciasDeProyecto(proyectoId);

        // Cascada real a nivel de base de datos (@OnDelete en MiembroProyecto/NotaProyecto/
        // TareaProyecto/EntidadDiagrama/AtributoEntidad/RelacionDiagrama) — Postgres borra el
        // resto de las filas hijas solo, sin importar por dónde llegue el delete.
        proyectoRepository.delete(proyecto);
    }

    private Proyecto buscarProyecto(Long proyectoId) {
        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));
    }
}
