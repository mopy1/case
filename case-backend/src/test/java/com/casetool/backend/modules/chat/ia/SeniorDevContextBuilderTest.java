package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;

import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.modules.chat.model.ChatMemoria;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMemoriaRepository;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.*;
import com.casetool.backend.modules.proyecto.repository.*;
import com.casetool.backend.modules.seguridad.model.Usuario;

@ExtendWith(MockitoExtension.class)
class SeniorDevContextBuilderTest {

    private static final Long P = 10L;

    @Mock ProyectoRepository proyectoRepo;
    @Mock MiembroProyectoRepository miembroRepo;
    @Mock ChatMensajeRepository chatRepo;
    @Mock ChatMemoriaRepository memoriaRepo;
    @Mock SeniorDevProyectoFormatter formatter;

    private SeniorDevContextBuilder builder;
    private final Proyecto proyecto = new Proyecto();
    private final Usuario ana = usuario(1L, "ana");
    private final Usuario maria = usuario(2L, "maria");

    @BeforeEach
    void setUp() {
        builder = new SeniorDevContextBuilder(proyectoRepo, miembroRepo, chatRepo, memoriaRepo, formatter);
        proyecto.setId(P);
        proyecto.setNombre("Tienda Online");
        when(proyectoRepo.findById(P)).thenReturn(Optional.of(proyecto));
        when(miembroRepo.findByProyectoId(P)).thenReturn(List.of(
                miembro(ana, MiembroProyecto.Rol.LECTOR), miembro(maria, MiembroProyecto.Rol.COLABORADOR)));
    }

    @Test
    void consultaLlevaIdAutorRolYAvisoDeLector() {
        sinMemoria();
        when(chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(eq(P), any(Limit.class))).thenReturn(List.of());

        String user = construir().get(1).content();

        assertThat(user)
                .contains("=== CONSULTA ACTUAL (responde a esta) ===")
                .contains("#143 [ana · LECTOR] pregunta: @SeniorDev ¿qué decidimos?")
                .contains("Empieza tu respuesta con @ana.")
                .contains("ana es LECTOR: no puede aplicar propuestas")
                .contains("Sí puede ver y descargar el DDL.")
                .contains("Proyecto: Tienda Online · Miembros: @ana (LECTOR), @maria (COLABORADOR)")
                .contains("(Todavía no hay memoria acumulada)");
    }

    @Test
    void historialExcluyeAlDisparadorMarcaHiloYQuitaComandosDeLaIa() {
        sinMemoria();
        ChatMensaje humano = mensaje(140L, maria, ChatMensaje.Tipo.USUARIO, "Revisemos Pedido");
        ChatMensaje ia = mensaje(141L, null, ChatMensaje.Tipo.IA,
                "@maria, conviene una tabla intermedia.\n\nCREAR_TABLA: [Detalle] (x: 1, y: 2)\nATRIBUTOS: [id:BIGINT:pk]");
        ia.setRespuestaA(humano);
        ChatMensaje disparador = mensaje(143L, ana, ChatMensaje.Tipo.USUARIO, "@SeniorDev ¿qué decidimos?");
        when(chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(P, Limit.of(31)))
                .thenReturn(List.of(disparador, ia, humano));

        String user = construir().get(1).content();
        String historial = user.substring(user.indexOf("=== HISTORIAL"), user.indexOf("=== CONSULTA"));

        assertThat(historial)
                .contains("(2 mensajes, del más viejo al más nuevo)")
                .contains("#140 [maria · COLABORADOR]: Revisemos Pedido")
                .contains("#141 [Senior Dev ↳ #140]: @maria, conviene una tabla intermedia.")
                .doesNotContain("CREAR_TABLA").doesNotContain("ATRIBUTOS").doesNotContain("#143");
        assertThat(historial.indexOf("#140")).isLessThan(historial.indexOf("#141"));
        verify(chatRepo).findByProyectoIdOrderByCreatedAtDescIdDesc(P, Limit.of(31));
    }

    @Test
    void memoriaPresenteVaPrimeroConSuMarca() {
        ChatMemoria memoria = new ChatMemoria();
        memoria.setResumen("- Decisiones: borrado lógico de Cliente (@maria, #12)");
        memoria.setUltimoMensajeResumidoId(117L);
        when(memoriaRepo.findById(P)).thenReturn(Optional.of(memoria));
        when(chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(eq(P), any(Limit.class))).thenReturn(List.of());

        List<DeepSeekMensaje> mensajes = construir();

        assertThat(mensajes.get(0).role()).isEqualTo("system");
        assertThat(mensajes.get(0).content()).isEqualTo(SeniorDevPrompts.SYSTEM_PROMPT);
        assertThat(mensajes.get(1).content())
                .startsWith("=== MEMORIA DEL EQUIPO (resumen de los mensajes hasta #117) ===\n- Decisiones: borrado lógico");
    }

    private List<DeepSeekMensaje> construir() {
        return builder.construirMensajes(new ChatMensajeResponse(143L, P, 1L, "ana", MiembroProyecto.Rol.LECTOR,
                ChatMensaje.Tipo.USUARIO, "@SeniorDev ¿qué decidimos?", null, Instant.now(), false, null, null));
    }

    private void sinMemoria() {
        when(memoriaRepo.findById(P)).thenReturn(Optional.empty());
    }

    private ChatMensaje mensaje(Long id, Usuario autor, ChatMensaje.Tipo tipo, String contenido) {
        ChatMensaje m = new ChatMensaje();
        m.setId(id);
        m.setProyecto(proyecto);
        m.setUsuario(autor);
        m.setTipo(tipo);
        m.setContenido(contenido);
        return m;
    }

    private MiembroProyecto miembro(Usuario u, MiembroProyecto.Rol rol) {
        MiembroProyecto m = new MiembroProyecto();
        m.setUsuario(u);
        m.setRol(rol);
        return m;
    }

    private static Usuario usuario(Long id, String username) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setUsername(username);
        return u;
    }
}
