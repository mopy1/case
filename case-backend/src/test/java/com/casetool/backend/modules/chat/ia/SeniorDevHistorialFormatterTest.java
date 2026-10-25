package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.seguridad.model.Usuario;

class SeniorDevHistorialFormatterTest {

    @Test
    void recortaCadaMensajeA600CaracteresYLoAplanaAUnaLinea() {
        ChatMensaje largo = mensaje(1L, ChatMensaje.Tipo.USUARIO, "hola\n\n" + "x".repeat(2000));

        String texto = SeniorDevHistorialFormatter.texto(largo);

        assertThat(texto).hasSize(SeniorDevLimites.HISTORIAL_CHARS).endsWith("…").startsWith("hola x").doesNotContain("\n");
    }

    @Test
    void quitaLineasDeComandosSoloEnMensajesDeIa() {
        String conComandos = "Propongo un ADR.\n- ADR_SUGERIDA: Borrado lógico\n  MOTIVO: historial\nGENERAR_DDL";

        assertThat(SeniorDevHistorialFormatter.texto(mensaje(1L, ChatMensaje.Tipo.IA, conComandos)))
                .isEqualTo("Propongo un ADR.");
        assertThat(SeniorDevHistorialFormatter.texto(mensaje(2L, ChatMensaje.Tipo.USUARIO, "GENERAR_DDL por favor")))
                .isEqualTo("GENERAR_DDL por favor");
    }

    @Test
    void loteParaResumenUsaIdYAutorSinRol() {
        ChatMensaje m = mensaje(12L, ChatMensaje.Tipo.USUARIO, "El borrado será lógico");
        Usuario maria = new Usuario();
        maria.setId(2L);
        maria.setUsername("maria");
        m.setUsuario(maria);

        assertThat(SeniorDevHistorialFormatter.lote(List.of(m, mensaje(13L, ChatMensaje.Tipo.IA, "Anotado"))))
                .isEqualTo("#12 [maria]: El borrado será lógico\n#13 [Senior Dev]: Anotado");
    }

    private static ChatMensaje mensaje(Long id, ChatMensaje.Tipo tipo, String contenido) {
        ChatMensaje m = new ChatMensaje();
        m.setId(id);
        m.setTipo(tipo);
        m.setContenido(contenido);
        return m;
    }
}
