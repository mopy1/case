package com.casetool.backend.modules.xmi.service.lector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.xmi.service.XmiDom;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AtributoXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ExtremoXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.GeneralizacionXmi;

/**
 * Formato "Native" de Enterprise Architect: un volcado de las tablas de su repositorio
 * (`<Package><Table name="t_object"><Row><Column name=".." value=".."/>`). Clases en `t_object`,
 * columnas en `t_attribute`, conectores en `t_connector` (la clase asociación va en `PDATA1` con
 * `SubType=Class`) y posiciones en `t_diagramobjects`. Los ids son los `Object_ID` del archivo.
 */
@Component
@Order(1)
public class LectorXmiNativoEA implements LectorXmi {

    private static final Set<String> TIPOS_CLASE = Set.of("Class", "Table");
    private static final Set<String> TIPOS_ASOCIACION = Set.of("Association", "Aggregation", "Composition");

    @Override
    public boolean reconoce(Document doc) {
        return "Package".equals(doc.getDocumentElement().getTagName()) && !filas(doc, "t_object").isEmpty();
    }

    @Override
    public ModeloXmi leer(Document doc) {
        Map<String, double[]> posiciones = new HashMap<>();
        for (Map<String, String> f : filas(doc, "t_diagramobjects")) {
            Double x = EaTaggedValues.numero(f.get("RectLeft"));
            Double y = EaTaggedValues.numero(f.get("RectTop"));
            if (x != null && y != null) posiciones.putIfAbsent(f.get("Object_ID"), new double[] { x, Math.abs(y) });
        }
        Map<String, List<AtributoXmi>> atributos = new HashMap<>();
        filas(doc, "t_attribute").stream()
                .sorted((a, b) -> Double.compare(orden(a.get("Pos")), orden(b.get("Pos"))))
                .forEach(f -> atributos.computeIfAbsent(f.get("Object_ID"), k -> new ArrayList<>())
                        .add(AtributoXmi.simple(f.get("Name"), f.getOrDefault("Type", "VARCHAR"))));
        List<ClaseXmi> clases = new ArrayList<>();
        for (Map<String, String> f : filas(doc, "t_object")) {
            if (!TIPOS_CLASE.contains(f.get("Object_Type"))) continue;
            String id = f.get("Object_ID");
            double[] p = posiciones.get(id);
            clases.add(new ClaseXmi(id, f.get("Name"), atributos.getOrDefault(id, List.of()),
                    p != null ? p[0] : null, p != null ? p[1] : null));
        }
        List<AsociacionXmi> asociaciones = new ArrayList<>();
        List<GeneralizacionXmi> generalizaciones = new ArrayList<>();
        for (Map<String, String> f : filas(doc, "t_connector")) {
            String tipo = f.get("Connector_Type");
            if ("Generalization".equals(tipo)) {
                generalizaciones.add(new GeneralizacionXmi(f.get("Start_Object_ID"), f.get("End_Object_ID")));
            } else if (TIPOS_ASOCIACION.contains(tipo)) {
                String claseAsociacion = "Class".equals(f.get("SubType")) ? f.get("PDATA1") : null;
                asociaciones.add(new AsociacionXmi(
                        new ExtremoXmi(f.get("Start_Object_ID"), f.getOrDefault("SourceCard", ""), agregacion(f.get("SourceIsAggregate"))),
                        new ExtremoXmi(f.get("End_Object_ID"), f.getOrDefault("DestCard", ""), agregacion(f.get("DestIsAggregate"))),
                        claseAsociacion));
            }
        }
        return new ModeloXmi("Enterprise Architect (Native)", clases, asociaciones, generalizaciones);
    }

    /** EA: 0 = nada, 1 = agregación (shared), 2 = composición. */
    private static String agregacion(String valor) {
        return "2".equals(valor) ? "composite" : "1".equals(valor) ? "shared" : "none";
    }

    private static double orden(String pos) {
        Double n = EaTaggedValues.numero(pos);
        return n != null ? n : 0;
    }

    /** Filas de `<Table name="...">` como mapas columna → valor. */
    private static List<Map<String, String>> filas(Document doc, String tabla) {
        List<Map<String, String>> res = new ArrayList<>();
        for (Element t : XmiDom.porEtiqueta(doc, "Table")) {
            if (!tabla.equals(t.getAttribute("name"))) continue;
            for (Element row : XmiDom.porEtiqueta(t, "Row")) {
                Map<String, String> fila = new HashMap<>();
                for (Element c : XmiDom.porEtiqueta(row, "Column")) fila.put(c.getAttribute("name"), c.getAttribute("value"));
                res.add(fila);
            }
        }
        return res;
    }
}
