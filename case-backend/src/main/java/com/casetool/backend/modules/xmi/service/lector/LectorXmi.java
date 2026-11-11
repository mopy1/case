package com.casetool.backend.modules.xmi.service.lector;

import org.w3c.dom.Document;

/** Traduce un formato de XMI al {@link ModeloXmi}. No toca la base de datos. */
public interface LectorXmi {

    /** true si el documento tiene la forma de este formato (detección automática, el usuario no elige). */
    boolean reconoce(Document doc);

    ModeloXmi leer(Document doc);
}
