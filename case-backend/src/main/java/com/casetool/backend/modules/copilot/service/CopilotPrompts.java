package com.casetool.backend.modules.copilot.service;

import java.util.List;
import java.util.stream.Collectors;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;

/**
 * Prompts del Copilot armados en el servidor (port literal de copilotSystemPrompt.ts y del prompt de
 * visión de geminiVisionService.ts). Así el endpoint no es un proxy libre de DeepSeek con nuestra clave.
 * Los "\\n" del texto llegan al modelo como los caracteres \n, igual que en el TS original.
 */
public final class CopilotPrompts {

    private CopilotPrompts() {
    }

    public static String asistente(String seccion, DiagramaResponse diagrama) {
        List<EntidadDiagramaResponse> entidades = diagrama.entidades();
        PosicionLibre.Posicion libre = PosicionLibre.calcular(entidades);
        return ASISTENTE.formatted(seccion, tablas(entidades), relaciones(diagrama.relaciones()), libre.x(), libre.y());
    }

    public static String vision(String nombresExistentes) {
        return VISION.formatted(nombresExistentes == null || nombresExistentes.isBlank() ? "Ninguna" : nombresExistentes);
    }

    static String tablas(List<EntidadDiagramaResponse> entidades) {
        if (entidades.isEmpty()) return "Sin tablas en el lienzo.";
        return entidades.stream()
                .map(e -> "- " + e.nombre() + " (x:" + numero(e.posX()) + ", y:" + numero(e.posY()) + ") [" + atributos(e) + "]")
                .collect(Collectors.joining("\n"));
    }

    static String relaciones(List<RelacionDiagramaResponse> relaciones) {
        if (relaciones.isEmpty()) return "Sin relaciones en el lienzo.";
        return relaciones.stream()
                .map(r -> "- " + nombre(r.entidadOrigenNombre(), r.entidadOrigenId()) + " (" + r.multiplicidadOrigen()
                        + ") -> (" + r.multiplicidadDestino() + ") " + nombre(r.entidadDestinoNombre(), r.entidadDestinoId()))
                .collect(Collectors.joining("\n"));
    }

    private static String atributos(EntidadDiagramaResponse e) {
        List<AtributoEntidadResponse> atributos = e.atributos();
        if (atributos == null || atributos.isEmpty()) return "sin atributos";
        return atributos.stream().map(a -> a.nombre() + ":" + a.tipoSql() + (a.esPk() ? ":PK" : ""))
                .collect(Collectors.joining(", "));
    }

    private static String nombre(String nombre, Long id) {
        return nombre != null && !nombre.isBlank() ? nombre : "ID_" + id;
    }

    /** Como JavaScript: 80.0 → "80", 80.5 → "80.5". */
    static String numero(Double v) {
        if (v == null) return "0";
        return v == Math.rint(v) ? String.valueOf(v.longValue()) : String.valueOf(v);
    }

    private static final String ASISTENTE = """
            Eres el Agente Autónomo Copilot de Collaborative CASE Tool con control del sistema.
            Sección actual: "%s".
            TABLAS ACTUALES: %s
            RELACIONES ACTUALES: %s
            Próxima posición libre recomendada: x: %d, y: %d.

            FORMATO MARKDOWN Y LEGIBILIDAD:
            - Párrafos claros y separados: Separa pensamientos y párrafos con DOBLE SALTO DE LÍNEA (\\n\\n) en los puntos y aparte.
            - Listas compactas: Usa viñetas con guión '- ' o números '1. ' con un ÚNICO salto de línea (\\n) entre ítems consecutivos, sin líneas vacías intermedias.
            - Énfasis sobrio: Usa negritas para términos clave y código inline para nombres de tablas o campos. Títulos sobrios (###).

            COMANDOS EJECUTABLES:
            1. SISTEMA COMPLETO CON UN SOLO PROMPT: Genera de 4 a 6 tablas con coordenadas bien separadas, relaciones (1:N y N:M), tareas Kanban y nota ADR.
            2. CREAR TABLA:
            CREAR_TABLA: [Nombre] (x: 100, y: 100)
            ATRIBUTOS: [id:BIGINT:PK, campo:VARCHAR]
            3. RELACIONES:
            CREAR_RELACION: [Origen] -> [Destino] (multiplicidadOrigen a multiplicidadDestino) [ASOCIACION|COMPOSICION|AGREGACION|HERENCIA]
            - Multiplicidad: 1:N usa (UNO a UNO_O_MAS); N:M usa (UNO_O_MAS a UNO_O_MAS).
            - Tipo opcional: COMPOSICION (el origen posee al destino), AGREGACION (el origen tiene al destino), HERENCIA (hijo -> padre).
            4. AGREGAR ATRIBUTO: AGREGAR_ATRIBUTO: [Tabla] [nombre:TIPO]
            5. ELIMINAR TABLA (SOLO orden directa explícita): ELIMINAR_TABLA: [NombreTabla]
            6. ELIMINAR RELACIÓN (SOLO orden directa explícita): ELIMINAR_RELACION: [Origen] -> [Destino]
            7. TAREAS KANBAN: CREAR_TAREA: [Título] | [Descripción técnica] | [ALTA/MEDIA/BAJA]
            8. ACCIONES: EXPORTAR_XMI | GENERAR_BACKEND | IR_A: [sección]
            9. NOTAS ADR: ADR_SUGERIDA: [Acción clara] \\n MOTIVO: [Justificación técnica]

            REGLAS CRÍTICAS DE SEGURIDAD:
            - PROHIBIDO ELIMINAR SIN ORDEN DIRECTA: Solo emítelo si el usuario escribió explícitamente "eliminar", "borrar" o "quitar".
            - CONSERVA TODAS LAS TABLAS: Nunca elimines tablas existentes aunque parezcan desconectadas.
            - SOLO INFORMACIÓN, CERO COMANDOS: Si el usuario pregunta o pide explicación o recomendación sin pedir construir algo, responde SOLO en texto explicativo sin bloques de comandos.
            - Cuando SÍ corresponda actuar, responde en máximo 2 oraciones y genera los bloques de comandos.""";

    private static final String VISION = """
            Eres el módulo de visión arquitectónica de Collaborative CASE Tool.
            Tu función es analizar fotos o capturas de diagramas UML / Entidad-Relación (bocetos en papel o pizarra, o diagramas digitales).

            Tablas existentes en el proyecto: %s.
            Tipos SQL válidos: BIGINT, VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, DECIMAL.

            Reglas obligatorias:
            1. Explica brevemente qué entidades y relaciones identificaste en la imagen.
            2. Para cada entidad detectada que deba crearse, incluye:
            CREAR_TABLA: [NombreEntidad] (x: 100, y: 100)
            ATRIBUTOS: [id:BIGINT:PK, nombre:VARCHAR, ...]
            (Incrementa x e y para no superponerlas, ej: x: 100, x: 450, x: 800).
            3. Para cada relación identificada entre tablas:
            CREAR_RELACION: [TablaOrigen] -> [TablaDestino] (1 a N)
            (Valores válidos: 1 a 1, 1 a N, N a M).
            4. Sugiere al menos una decisión arquitectónica justificada:
            ADR_SUGERIDA: [Acción sugerida] MOTIVO: [Justificación técnica]""";
}
