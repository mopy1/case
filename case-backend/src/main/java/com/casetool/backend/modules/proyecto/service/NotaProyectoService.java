package com.casetool.backend.modules.proyecto.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.proyecto.dto.NotaProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.NotaProyectoResponse;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.NotaProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.NotaProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@Service
@Transactional
public class NotaProyectoService {

    private final NotaProyectoRepository notaProyectoRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoAccesoService accesoService;

    public NotaProyectoService(
            NotaProyectoRepository notaProyectoRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            ProyectoAccesoService accesoService) {
        this.notaProyectoRepository = notaProyectoRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.accesoService = accesoService;
    }

    public NotaProyectoResponse crear(Long proyectoId, NotaProyectoRequest request, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        NotaProyecto nota = new NotaProyecto();
        nota.setProyecto(proyecto);
        nota.setUsuario(usuario);
        nota.setAccion(request.accion());
        nota.setMotivo(request.motivo());
        notaProyectoRepository.save(nota);

        return NotaProyectoResponse.from(nota);
    }

    @Transactional(readOnly = true)
    public List<NotaProyectoResponse> listar(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        return notaProyectoRepository.findByProyectoIdOrderByCreatedAtDesc(proyectoId).stream()
                .map(NotaProyectoResponse::from)
                .toList();
    }
}
