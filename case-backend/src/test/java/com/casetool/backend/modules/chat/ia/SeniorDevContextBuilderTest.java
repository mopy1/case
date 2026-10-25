package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;

import com.casetool.backend.modules.chat.ia.dto.DeepSeekChatRequest.Mensaje;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.diagrama.model.*;
import com.casetool.backend.modules.diagrama.repository.*;
import com.casetool.backend.modules.proyecto.model.*;
import com.casetool.backend.modules.proyecto.repository.*;
import com.casetool.backend.modules.seguridad.model.Usuario;

@ExtendWith(MockitoExtension.class)
class SeniorDevContextBuilderTest {

    private static final Long PROY_ID = 10L;

    @Mock ProyectoRepository proyectoRepo;
    @Mock MiembroProyectoRepository miembroRepo;
    @Mock EntidadDiagramaRepository entidadRepo;
    @Mock AtributoEntidadRepository atributoRepo;
    @Mock RelacionDiagramaRepository relacionRepo;
    @Mock TareaProyectoRepository tareaRepo;
    @Mock NotaProyectoRepository notaRepo;
    @Mock ChatMensajeRepository chatRepo;

    @Test
    void construyePromptEnCuatroCapasConContextoCompleto() {
        SeniorDevProyectoFormatter formatter = new SeniorDevProyectoFormatter(
                entidadRepo, atributoRepo, relacionRepo, tareaRepo, notaRepo);
        SeniorDevContextBuilder builder = new SeniorDevContextBuilder(
                proyectoRepo, miembroRepo, chatRepo, formatter);

        Proyecto proyecto = new Proyecto();
        proyecto.setId(PROY_ID);
        proyecto.setNombre("ERP Ventas");
        proyecto.setDescripcion("Sistema de gestión");
        when(proyectoRepo.findById(PROY_ID)).thenReturn(Optional.of(proyecto));

        Usuario userAdrian = usuario(1L, "adrian");
        Usuario userMaria = usuario(2L, "maria");

        MiembroProyecto m1 = new MiembroProyecto();
        m1.setUsuario(userAdrian);
        m1.setRol(MiembroProyecto.Rol.ADMIN);

        MiembroProyecto m2 = new MiembroProyecto();
        m2.setUsuario(userMaria);
        m2.setRol(MiembroProyecto.Rol.COLABORADOR);
        when(miembroRepo.findByProyectoId(PROY_ID)).thenReturn(List.of(m1, m2));

        EntidadDiagrama entidadCliente = new EntidadDiagrama();
        entidadCliente.setId(101L);
        entidadCliente.setNombre("Cliente");
        entidadCliente.setProyecto(proyecto);
        when(entidadRepo.findByProyectoId(PROY_ID)).thenReturn(List.of(entidadCliente));

        AtributoEntidad attrId = new AtributoEntidad();
        attrId.setId(201L);
        attrId.setEntidad(entidadCliente);
        attrId.setNombre("id");
        attrId.setTipoSql("INT");
        attrId.setEsPk(true);
        when(atributoRepo.findByProyectoId(PROY_ID)).thenReturn(List.of(attrId));

        RelacionDiagrama relacion = new RelacionDiagrama();
        relacion.setEntidadOrigen(entidadCliente);
        relacion.setEntidadDestino(entidadCliente);
        relacion.setMultiplicidadOrigen(RelacionDiagrama.Multiplicidad.UNO);
        relacion.setMultiplicidadDestino(RelacionDiagrama.Multiplicidad.CERO_O_MAS);
        relacion.setTipo(RelacionDiagrama.TipoRelacionUml.ASOCIACION);
        when(relacionRepo.findByProyectoId(PROY_ID)).thenReturn(List.of(relacion));

        TareaProyecto tarea = new TareaProyecto();
        tarea.setTitulo("Crear índices");
        tarea.setEstado(TareaProyecto.Estado.PENDIENTE);
        tarea.setPrioridad(TareaProyecto.Prioridad.ALTA);
        tarea.setUsuario(userAdrian);
        when(tareaRepo.findByProyectoIdOrderByCreatedAtDesc(PROY_ID)).thenReturn(List.of(tarea));

        NotaProyecto nota = new NotaProyecto();
        nota.setAccion("Normalización a 3FN");
        nota.setMotivo("Evitar redundancia");
        nota.setUsuario(userAdrian);
        when(notaRepo.findByProyectoIdOrderByCreatedAtDesc(PROY_ID)).thenReturn(List.of(nota));

        ChatMensaje msgPrevio = new ChatMensaje();
        msgPrevio.setId(50L);
        msgPrevio.setProyecto(proyecto);
        msgPrevio.setUsuario(userMaria);
        msgPrevio.setTipo(ChatMensaje.Tipo.USUARIO);
        msgPrevio.setContenido("Hola equipo");
        when(chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(eq(PROY_ID), any(Limit.class)))
                .thenReturn(List.of(msgPrevio));

        List<Mensaje> mensajes = builder.construirMensajes(PROY_ID, "@SeniorDev ¿conviene normalizar?");

        assertThat(mensajes).hasSize(2);
        assertThat(mensajes.get(0).role()).isEqualTo("system");
        assertThat(mensajes.get(0).content()).contains("Senior Dev").contains("Reglas obligatorias");

        String userPrompt = mensajes.get(1).content();
        assertThat(userPrompt)
                .contains("=== ESTADO DEL PROYECTO ===")
                .contains("Proyecto: ERP Ventas")
                .contains("@adrian (ADMIN)")
                .contains("@maria (COLABORADOR)")
                .contains("Cliente (id: INT PK)")
                .contains("Cliente (1) -> Cliente (0..*) [ASOCIACION]")
                .contains("[PENDIENTE] Crear índices (Prioridad: ALTA, Asignado: adrian)")
                .contains("Normalización a 3FN (por adrian): Evitar redundancia")
                .contains("=== HISTORIAL DE LA SALA (ÚLTIMOS MENSAJES) ===")
                .contains("[maria · COLABORADOR]: Hola equipo")
                .contains("=== CONSULTA ACTUAL ===")
                .contains("@SeniorDev ¿conviene normalizar?");
    }

    private static Usuario usuario(Long id, String username) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setUsername(username);
        return u;
    }
}
