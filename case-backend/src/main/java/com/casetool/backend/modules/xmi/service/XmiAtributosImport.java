package com.casetool.backend.modules.xmi.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.service.AtributoEntidadService;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AtributoXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;

/**
 * Crea las columnas de una clase importada. Lo que el archivo dice (dialecto propio) se respeta; lo que
 * no dice (EA nunca marca PK/FK) se deduce por nombre:
 * <ul>
 *   <li><b>FK:</b> "idGrupo", "grupo_id", "id_grupo", "grupoId" → FK a la clase "grupo".</li>
 *   <li><b>PK clase normal:</b> "id"; si no hay, la primera columna que no sea FK ("codigo", "sigla").</li>
 *   <li><b>PK tabla intermedia</b> (clase asociación): "id" si existe; si no, sus FK a los dos extremos
 *       (clave compuesta). Si le falta la FK a un extremo, se agrega "{extremo}_id".</li>
 * </ul>
 */
@Component
class XmiAtributosImport {

    private final AtributoEntidadService atributoService;

    XmiAtributosImport(AtributoEntidadService atributoService) {
        this.atributoService = atributoService;
    }

    /** @param extremos ids xmi de las dos clases que une si es clase asociación; vacío si es una clase normal. */
    void crear(ClaseXmi clase, Long entidadId, Map<String, Long> idPorXmiId, Map<String, String> nombrePorXmiId,
            List<String> extremos, Long usuarioId) {
        List<AtributoXmi> atributos = clase.atributos();
        List<String> fks = new ArrayList<>();
        for (AtributoXmi a : atributos) {
            fks.add(a.fkClaseId() != null || a.esPk() != null ? a.fkClaseId() : detectarFk(a.nombre(), clase.id(), nombrePorXmiId));
        }
        boolean tieneId = atributos.stream().anyMatch(a -> "id".equalsIgnoreCase(a.nombre().trim()));
        int primeraNoFk = fks.indexOf(null);
        for (int i = 0; i < atributos.size(); i++) {
            AtributoXmi a = atributos.get(i);
            String fk = fks.get(i);
            boolean pk = a.esPk() != null ? a.esPk()
                    : tieneId ? "id".equalsIgnoreCase(a.nombre().trim())
                    : !extremos.isEmpty() ? extremos.contains(fk) : i == primeraNoFk;
            boolean nullable = a.nullable() != null ? a.nullable() : !pk && fk == null;
            Long ref = fk != null ? idPorXmiId.get(fk) : null;
            atributoService.agregar(entidadId, new AtributoEntidadRequest(
                    recortar(a.nombre()), XmiTiposSql.mapear(a.tipo()), pk, ref != null, ref, nullable), usuarioId);
        }
        for (String extremo : extremos) {
            if (fks.contains(extremo) || idPorXmiId.get(extremo) == null) continue;
            atributoService.agregar(entidadId, new AtributoEntidadRequest(recortar(nombrePorXmiId.get(extremo) + "_id"),
                    "BIGINT", !tieneId, true, idPorXmiId.get(extremo), false), usuarioId);
        }
    }

    /** Id xmi de la clase a la que apunta una columna por su nombre, o null. */
    static String detectarFk(String nombreAtributo, String claseActualId, Map<String, String> nombrePorXmiId) {
        String atributo = normalizar(nombreAtributo);
        for (Map.Entry<String, String> e : nombrePorXmiId.entrySet()) {
            if (e.getKey().equals(claseActualId)) continue;
            String clase = normalizar(e.getValue());
            if (!clase.isEmpty() && (atributo.equals("id" + clase) || atributo.equals(clase + "id"))) return e.getKey();
        }
        return null;
    }

    private static String normalizar(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private static String recortar(String s) {
        return s.length() > 100 ? s.substring(0, 100) : s;
    }
}
