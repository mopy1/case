package com.casetool.backend.modules.proyecto.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.proyecto.dto.MiembroProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.MiembroProyectoResponse;
import com.casetool.backend.modules.proyecto.exception.MiembroYaExisteException;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@Service
@Transactional
public class MiembroProyectoService {

    private final MiembroProyectoRepository miembroProyectoRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoAccesoService accesoService;

    public MiembroProyectoService(
            MiembroProyectoRepository miembroProyectoRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            ProyectoAccesoService accesoService) {
        this.miembroProyectoRepository = miembroProyectoRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.accesoService = accesoService;
    }

    public MiembroProyectoResponse agregar(Long proyectoId, MiembroProyectoRequest request, Long usuarioId) {
        Proyecto proyecto = buscarProyecto(proyectoId);
        MiembroProyecto quienAgrega = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(quienAgrega);

        Usuario usuarioAAgregar = usuarioRepository
                .findByUsernameOrEmail(request.usernameOrEmail(), request.usernameOrEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + request.usernameOrEmail()));

        if (miembroProyectoRepository.existsByProyectoIdAndUsuarioId(proyectoId, usuarioAAgregar.getId())) {
            throw new MiembroYaExisteException("Ese usuario ya es colaborador de este proyecto");
        }

        MiembroProyecto miembro = new MiembroProyecto();
        miembro.setProyecto(proyecto);
        miembro.setUsuario(usuarioAAgregar);
        miembro.setRol(request.rol());
        miembroProyectoRepository.save(miembro);

        return MiembroProyectoResponse.from(miembro);
    }

    @Transactional(readOnly = true)
    public List<MiembroProyectoResponse> listar(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        return miembroProyectoRepository.findByProyectoId(proyectoId).stream()
                .map(MiembroProyectoResponse::from)
                .toList();
    }

    public MiembroProyectoResponse cambiarRol(
            Long proyectoId, Long usuarioObjetivoId, MiembroProyecto.Rol nuevoRol, Long usuarioId) {
        MiembroProyecto quienCambia = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(quienCambia);

        MiembroProyecto objetivo = buscarMiembro(proyectoId, usuarioObjetivoId);
        accesoService.verificarNoEsUltimoAdmin(proyectoId, objetivo);

        objetivo.setRol(nuevoRol);
        return MiembroProyectoResponse.from(miembroProyectoRepository.save(objetivo));
    }

    public void quitar(Long proyectoId, Long usuarioObjetivoId, Long usuarioId) {
        MiembroProyecto quienQuita = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(quienQuita);

        MiembroProyecto objetivo = buscarMiembro(proyectoId, usuarioObjetivoId);
        accesoService.verificarNoEsUltimoAdmin(proyectoId, objetivo);

        miembroProyectoRepository.delete(objetivo);
    }

    private Proyecto buscarProyecto(Long proyectoId) {
        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));
    }

    private MiembroProyecto buscarMiembro(Long proyectoId, Long usuarioObjetivoId) {
        return miembroProyectoRepository.findByProyectoIdAndUsuarioId(proyectoId, usuarioObjetivoId)
                .orElseThrow(() -> new ResourceNotFoundException("Ese usuario no es colaborador de este proyecto"));
    }
}
