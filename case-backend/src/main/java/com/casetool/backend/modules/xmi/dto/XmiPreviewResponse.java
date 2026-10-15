package com.casetool.backend.modules.xmi.dto;

import java.util.List;

/** Lo que va a pasar si se confirma el import — se muestra al ADMIN antes de tocar la base de
 * datos (el parseo no persiste nada). {@code tablasExistentes} son las del archivo que ya están en
 * el proyecto con ese mismo nombre: en modo FUSIONAR se reusan tal cual (no se tocan sus atributos,
 * no se duplican — solo se crean las relaciones nuevas que las involucren). {@code
 * totalEntidadesActuales} es el total de tablas que YA tiene el proyecto ahora mismo (con
 * cualquier nombre) — en modo REEMPLAZAR todas esas se borran antes de importar, no solo las que
 * coinciden de nombre con el archivo. */
public record XmiPreviewResponse(
        String dialectoDetectado,
        List<String> tablas,
        List<String> tablasExistentes,
        int totalRelaciones,
        int totalEntidadesActuales) {
}
