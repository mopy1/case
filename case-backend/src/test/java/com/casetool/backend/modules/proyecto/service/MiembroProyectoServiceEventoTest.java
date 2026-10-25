package com.casetool.backend.modules.proyecto.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.casetool.backend.modules.proyecto.dto.MiembroProyectoRequest;
import com.casetool.backend.modules.proyecto.exception.MiembroYaExisteException;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class MiembroProyectoServiceEventoTest {

    @Mock MiembroProyectoRepository miembroRepo;
    @Mock ProyectoRepository proyectoRepo;
    @Mock UsuarioRepository usuarioRepo;
    @Mock ProyectoAccesoService acceso;
    @Mock ApplicationEventPublisher publisher;

    private MiembroProyectoService service;
    private final MiembroProyectoRequest req = new MiembroProyectoRequest("maria", MiembroProyecto.Rol.COLABORADOR);

    @BeforeEach
    void setUp() {
        service = new MiembroProyectoService(miembroRepo, proyectoRepo, usuarioRepo, acceso, publisher);
        Proyecto p = new Proyecto();
        p.setId(5L);
        when(proyectoRepo.findById(5L)).thenReturn(Optional.of(p));
        MiembroProyecto admin = new MiembroProyecto();
        admin.setRol(MiembroProyecto.Rol.ADMIN);
        when(acceso.verificarMiembro(5L, 1L)).thenReturn(admin);
        Usuario maria = new Usuario();
        maria.setId(7L);
        maria.setUsername("maria");
        when(usuarioRepo.findByUsernameOrEmail("maria", "maria")).thenReturn(Optional.of(maria));
    }

    @Test
    void publicaElEventoDespuesDelSave() {
        when(miembroRepo.existsByProyectoIdAndUsuarioId(5L, 7L)).thenReturn(false);

        service.agregar(5L, req, 1L);

        InOrder orden = inOrder(miembroRepo, publisher);
        orden.verify(miembroRepo).save(any(MiembroProyecto.class));
        orden.verify(publisher).publishEvent(new MiembroAgregadoEvent(5L, "maria", MiembroProyecto.Rol.COLABORADOR));
    }

    @Test
    void miembroDuplicadoDa409YNoPublica() {
        when(miembroRepo.existsByProyectoIdAndUsuarioId(5L, 7L)).thenReturn(true);

        assertThatThrownBy(() -> service.agregar(5L, req, 1L)).isInstanceOf(MiembroYaExisteException.class);
        verifyNoInteractions(publisher);
    }
}
