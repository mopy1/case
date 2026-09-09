package com.casetool.backend.modules.proyecto.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.proyecto.dto.CambiarEstadoTareaRequest;
import com.casetool.backend.modules.proyecto.dto.TareaProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.TareaProyectoResponse;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.model.TareaProyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.TareaProyectoRepository;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@Service
@Transactional
public class TareaProyectoService {

    private final TareaProyectoRepository tareaProyectoRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoAccesoService accesoService;

    public TareaProyectoService(
            TareaProyectoRepository tareaProyectoRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            ProyectoAccesoService accesoService) {
        this.tareaProyectoRepository = tareaProyectoRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.accesoService = accesoService;
    }

    public TareaProyectoResponse crear(TareaProyectoRequest request, Long proyectoId, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));

        TareaProyecto tarea = new TareaProyecto();
        tarea.setProyecto(proyecto);
        tarea.setTitulo(request.titulo());
        tarea.setDescripcion(request.descripcion());
        tarea.setPrioridad(request.prioridad());
        tarea.setEstado(TareaProyecto.Estado.PENDIENTE);
        aplicarAsignado(tarea, request.usuarioId(), proyectoId);

        return TareaProyectoResponse.from(tareaProyectoRepository.save(tarea));
    }

    @Transactional(readOnly = true)
    public List<TareaProyectoResponse> listarPorProyecto(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        return tareaProyectoRepository.findByProyectoIdOrderByCreatedAtDesc(proyectoId).stream()
                .map(TareaProyectoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TareaProyectoResponse obtenerPorId(Long tareaId, Long usuarioId) {
        TareaProyecto tarea = buscarTarea(tareaId);
        accesoService.verificarMiembro(tarea.getProyecto().getId(), usuarioId);
        return TareaProyectoResponse.from(tarea);
    }

    public TareaProyectoResponse actualizar(Long tareaId, TareaProyectoRequest request, Long usuarioId) {
        TareaProyecto tarea = buscarTarea(tareaId);
        Long proyectoId = tarea.getProyecto().getId();
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        tarea.setTitulo(request.titulo());
        tarea.setDescripcion(request.descripcion());
        tarea.setPrioridad(request.prioridad());
        aplicarAsignado(tarea, request.usuarioId(), proyectoId);

        return TareaProyectoResponse.from(tareaProyectoRepository.save(tarea));
    }

    public TareaProyectoResponse cambiarEstadoTarea(CambiarEstadoTareaRequest request, Long tareaId, Long usuarioId) {
        TareaProyecto tarea = buscarTarea(tareaId);
        MiembroProyecto miembro = accesoService.verificarMiembro(tarea.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        tarea.setEstado(request.estado());
        return TareaProyectoResponse.from(tareaProyectoRepository.save(tarea));
    }

    public void eliminar(Long tareaId, Long usuarioId) {
        TareaProyecto tarea = buscarTarea(tareaId);
        MiembroProyecto miembro = accesoService.verificarMiembro(tarea.getProyecto().getId(), usuarioId);
        accesoService.verificarPuedeEscribir(miembro);

        tareaProyectoRepository.delete(tarea);
    }

    private TareaProyecto buscarTarea(Long tareaId) {
        return tareaProyectoRepository.findById(tareaId)
                .orElseThrow(() -> new ResourceNotFoundException("Tarea no encontrada"));
    }

    private void aplicarAsignado(TareaProyecto tarea, Long usuarioAsignadoId, Long proyectoId) {
        if (usuarioAsignadoId == null) {
            tarea.setUsuario(null);
            return;
        }
        Usuario usuario = usuarioRepository.findById(usuarioAsignadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario a asignar no encontrado"));
        accesoService.verificarEsMiembroDelProyecto(proyectoId, usuarioAsignadoId);
        tarea.setUsuario(usuario);
    }
}
