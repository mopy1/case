package com.casetool.backend.modules.copilot.guia;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

import org.springframework.stereotype.Component;

/**
 * Búsqueda por puntaje sobre los temas del manual (17 documentos: no hace falta full-text de Postgres).
 * Puntaje por token: título +3, palabra clave +4, resumen +2, contenido +1; +2 si coincide la sección.
 */
@Component
public class ManualBuscador {

    private static final Set<String> STOPWORDS = Set.of(
            "como", "que", "para", "con", "los", "las", "una", "del", "por", "esto", "donde", "hago", "usar");

    /** Campos ya normalizados al arrancar, para no repetirlo en cada búsqueda. */
    private record Indexado(ManualTema tema, String titulo, String claves, String resumen, String contenido) {}

    private final List<Indexado> indice;

    public ManualBuscador(ManualRepositorio repositorio) {
        this.indice = repositorio.temas().stream()
                .map(t -> new Indexado(t, normalizar(t.titulo()),
                        normalizar(t.palabrasClave() != null ? String.join(" | ", t.palabrasClave()) : ""),
                        normalizar(t.resumen()), normalizar(t.contenido())))
                .toList();
    }

    /** Los {@code limite} temas con puntaje > 0, de mayor a menor; empate → orden del archivo. */
    public List<ManualTema> buscar(String consulta, String seccion, int limite) {
        Set<String> tokens = tokens(consulta);
        if (tokens.isEmpty()) return List.of();
        int[] puntajes = indice.stream().mapToInt(i -> puntaje(i, tokens, seccion)).toArray();
        return IntStream.range(0, indice.size())
                .filter(i -> puntajes[i] > 0)
                .boxed()
                .sorted(Comparator.comparingInt((Integer i) -> -puntajes[i]).thenComparingInt(i -> i))
                .limit(limite)
                .map(i -> indice.get(i).tema())
                .toList();
    }

    private static int puntaje(Indexado i, Set<String> tokens, String seccion) {
        int p = 0;
        for (String t : tokens) {
            if (i.titulo().contains(t)) p += 3;
            if (i.claves().contains(t)) p += 4;
            if (i.resumen().contains(t)) p += 2;
            if (i.contenido().contains(t)) p += 1;
        }
        return p > 0 && i.tema().seccion().equals(seccion) ? p + 2 : p;
    }

    static Set<String> tokens(String consulta) {
        Set<String> tokens = new LinkedHashSet<>();
        Arrays.stream(normalizar(consulta).split(" "))
                .filter(t -> t.length() >= 3 && !STOPWORDS.contains(t))
                .map(ManualBuscador::singular)
                .forEach(tokens::add);
        return tokens;
    }

    /** Plural simple: "relaciones" → "relacion", "tablas" → "tabla" (solo si quedan ≥ 4 letras). */
    static String singular(String t) {
        if (t.endsWith("es") && t.length() - 2 >= 4) return t.substring(0, t.length() - 2);
        if (t.endsWith("s") && t.length() - 1 >= 4) return t.substring(0, t.length() - 1);
        return t;
    }

    /** Minúsculas, sin tildes y todo lo que no sea letra o número pasa a espacio. */
    static String normalizar(String texto) {
        if (texto == null) return "";
        String sinTildes = Normalizer.normalize(texto.toLowerCase(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinTildes.replaceAll("[^a-z0-9]+", " ").trim();
    }
}
