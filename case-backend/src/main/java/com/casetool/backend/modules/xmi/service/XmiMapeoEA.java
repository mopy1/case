package com.casetool.backend.modules.xmi.service;

import java.util.List;
import java.util.Map;

import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;

/** Traducciones puntuales del dialecto Enterprise Architect (XMI 1.1) al modelo interno: tipo SQL
 * de un atributo, multiplicidad, tipo de relación según `aggregation` y extremos de una
 * `UML:Generalization`. Funciones puras, no tocan la base de datos. */
public final class XmiMapeoEA {

    private XmiMapeoEA() {
    }

    /** El tipo de un `UML:Attribute` viene anidado (`StructuralFeature.type > DataType`), no
     * como atributo plano — a diferencia del dialecto propio. Dos formas válidas, según quién
     * generó el archivo:
     * <ul>
     *   <li>`xmi.idref` apuntando a un `UML:DataType` compartido colgado del paquete (lo que
     *       exporta un Enterprise Architect real, o lo que exportaba esta misma herramienta antes
     *       del 2026-09-23) — se resuelve contra {@code tipoSqlPorId}.</li>
     *   <li>El propio `UML:DataType` anidado ya trae su `name` (lo que exporta esta herramienta
     *       desde el 2026-09-23 — ver `XmiClasesUml#construirAtributo` — a propósito para que
     *       el tipo no aparezca como un elemento más del árbol de proyecto en EA) — se lee
     *       directo, sin necesitar el mapa.</li>
     * </ul> */
    public static String resolverTipoSqlEA(Element attrEl, Map<String, String> tipoSqlPorId) {
        // EA real anida `UML:Classifier xmi.idref` (o `UML:DataType`) dentro de StructuralFeature.type.
        for (String etiqueta : new String[] { "UML:DataType", "UML:Classifier" }) {
            List<Element> tipos = XmiDom.porEtiqueta(attrEl, etiqueta);
            if (tipos.isEmpty()) continue;
            Element tipo = tipos.get(0);
            String porIdref = tipoSqlPorId.get(tipo.getAttribute("xmi.idref"));
            if (porIdref != null) return porIdref;
            if (!tipo.getAttribute("name").isBlank()) return tipo.getAttribute("name");
        }
        return "VARCHAR";
    }

    /**
     * Multiplicidad escrita a mano en EA → enum. Acepta "1", "0..1", "*", "n", "0..*", "1..*", "1..n" y la
     * forma incompleta "1.." (EA la deja así si no se completa el tope = muchos). Vacía o desconocida → null
     * (el archivo no la indica; el materializador decide el valor por defecto).
     */
    public static Multiplicidad parsearMultiplicidad(String texto) {
        String t = texto == null ? "" : texto.replace(" ", "").toLowerCase();
        if (t.isEmpty()) return null;
        String[] partes = t.split("\\.\\.", -1);
        String inferior = partes[0];
        String superior = partes.length > 1 ? partes[1] : partes[0];
        boolean muchos = superior.isEmpty() || superior.equals("*") || superior.equals("n") || superior.equals("-1")
                || (superior.matches("\\d+") && Integer.parseInt(superior) > 1);
        boolean opcional = inferior.matches("0|\\*|n|-1") || (partes.length == 1 && muchos);
        if (!inferior.matches("\\d+|\\*|n|-1")) return null;
        if (muchos) return opcional ? Multiplicidad.CERO_O_MAS : Multiplicidad.UNO_O_MAS;
        return opcional ? Multiplicidad.CERO_O_UNO : Multiplicidad.UNO;
    }

    /** `aggregation` de cualquiera de los 2 extremos: "composite" → COMPOSICION; "shared" (UML 2)
     * o "aggregate" (UML 1.4) → AGREGACION; si no, ASOCIACION. */
    public static TipoRelacionUml tipoDesdeAggregation(String agg0, String agg1) {
        if ("composite".equalsIgnoreCase(agg0) || "composite".equalsIgnoreCase(agg1)) {
            return TipoRelacionUml.COMPOSICION;
        }
        if ("shared".equalsIgnoreCase(agg0) || "aggregate".equalsIgnoreCase(agg0)
                || "shared".equalsIgnoreCase(agg1) || "aggregate".equalsIgnoreCase(agg1)) {
            return TipoRelacionUml.AGREGACION;
        }
        return TipoRelacionUml.ASOCIACION;
    }

    /** {hijo, padre} de una `UML:Generalization`. Según quién generó el archivo vienen como
     * atributos `child`/`parent`, como `subtype`/`supertype`, o anidados como
     * `UML:Generalization.child > UML:Class xmi.idref`. Un valor vacío = no se encontró. */
    public static String[] extremosGeneralizacion(Element gen) {
        String childRef = gen.getAttribute("child");
        String parentRef = gen.getAttribute("parent");
        if ((childRef.isEmpty() || parentRef.isEmpty()) && gen.hasAttribute("subtype") && gen.hasAttribute("supertype")) {
            childRef = gen.getAttribute("subtype");
            parentRef = gen.getAttribute("supertype");
        }
        if (childRef.isEmpty()) {
            childRef = refAnidada(gen, "UML:Generalization.child", childRef);
        }
        if (parentRef.isEmpty()) {
            parentRef = refAnidada(gen, "UML:Generalization.parent", parentRef);
        }
        return new String[] { childRef, parentRef };
    }

    private static String refAnidada(Element gen, String etiqueta, String porDefecto) {
        List<Element> contenedores = XmiDom.porEtiqueta(gen, etiqueta);
        if (contenedores.isEmpty() || XmiDom.porEtiqueta(contenedores.get(0), "UML:Class").isEmpty()) {
            return porDefecto;
        }
        return XmiDom.porEtiqueta(contenedores.get(0), "UML:Class").get(0).getAttribute("xmi.idref");
    }
}
