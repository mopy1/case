package com.casetool.backend.modules.chat.service;

import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.seguridad.model.Usuario;

/** Entidades mínimas en memoria para los tests unitarios del chat (sin BD). */
final class ChatFixtures {

    private ChatFixtures() {
    }

    static Proyecto proyecto(Long id) {
        Proyecto p = new Proyecto();
        p.setId(id);
        return p;
    }

    static Usuario usuario(Long id, String username) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setUsername(username);
        return u;
    }

    static ChatMensaje mensaje(Long id, Proyecto proyecto, Usuario autor) {
        ChatMensaje m = new ChatMensaje();
        m.setId(id);
        m.setProyecto(proyecto);
        m.setUsuario(autor);
        m.setTipo(ChatMensaje.Tipo.USUARIO);
        m.setContenido("m" + id);
        return m;
    }

    static MiembroProyecto miembro(Proyecto proyecto, Usuario usuario, MiembroProyecto.Rol rol) {
        MiembroProyecto mp = new MiembroProyecto();
        mp.setProyecto(proyecto);
        mp.setUsuario(usuario);
        mp.setRol(rol);
        return mp;
    }
}
