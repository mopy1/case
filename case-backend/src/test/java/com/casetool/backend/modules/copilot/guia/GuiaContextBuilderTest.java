package com.casetool.backend.modules.copilot.guia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.copilot.CopilotFixtures;
import com.casetool.backend.modules.copilot.dto.CopilotTurno;
import com.casetool.backend.modules.copilot.dto.MisionGuia;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;

@ExtendWith(MockitoExtension.class)
class GuiaContextBuilderTest {

    @Mock MiembroProyectoRepository repo;

    private String construir(String seccion, List<CopilotTurno> h, List<MisionGuia> m) {
        when(repo.findByProyectoId(5L)).thenReturn(List.of(new MiembroProyecto(), new MiembroProyecto()));
        return new GuiaContextBuilder(repo).usuario(new GuiaContexto(5L, "ana", MiembroProyecto.Rol.COLABORADOR,
                seccion, "¿Cómo hago una N:M?", CopilotFixtures.libroAutor(), h, m));
    }

    @Test
    void contextoCompletoConHistorial() {
        String s = construir("diagrama",
                List.of(new CopilotTurno("usuario", "¿Qué hago ahora?"), new CopilotTurno("asistente", " Creá dos tablas ")),
                List.of(MisionGuia.RELACIONAR, MisionGuia.INVITAR, MisionGuia.EXPORTAR));

        assertThat(s).isEqualTo("""
                === CONTEXTO ===
                Usuario: @ana · rol COLABORADOR
                Sección actual: Diagrama
                Proyecto: 2 tablas (1 con atributos) · 1 relación · 2 miembros
                Misiones pendientes: Relacioná dos tablas; Sumá a un compañero; Exportá el XMI o generá el backend
                === CONVERSACIÓN RECIENTE ===
                Usuario: ¿Qué hago ahora?
                Guía: Creá dos tablas
                === PREGUNTA ===
                ¿Cómo hago una N:M?""");
    }

    @Test
    void sinMisionesNiHistorial() {
        String s = construir("generador", null, List.of());

        assertThat(s).contains("Sección actual: Generador de backend", "Misiones pendientes: ninguna")
                .doesNotContain("CONVERSACIÓN RECIENTE");
    }
}
