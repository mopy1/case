package com.casetool.backend.core.ia;

/**
 * Reglas de modelado y de lienzo que comparten el Copilot y Senior Dev. Explican a la IA cómo funciona de
 * verdad el diagramador (qué hace solo el sistema y qué tiene que pedir ella), para que sus propuestas no
 * dupliquen tablas intermedias, usen el tipo de relación correcto y dejen el diagrama ordenado.
 * Sin '%': el prompt del Copilot pasa por String.formatted.
 */
public final class IaReglasModelado {

    public static final String TEXTO = """
            CÓMO FUNCIONA EL DIAGRAMADOR (respétalo al proponer cambios):
            - Usa los nombres de tabla EXACTOS del estado actual. Si una tabla ya existe, no la vuelvas a crear: agrégale columnas con AGREGAR_ATRIBUTO.
            - Multiplicidades válidas: UNO, CERO_O_UNO, UNO_O_MAS, CERO_O_MAS. 1:1 = (UNO a UNO); 1:N = (UNO a UNO_O_MAS); N:M = (UNO_O_MAS a UNO_O_MAS) o con CERO_O_MAS.
            - Tipo de relación: ASOCIACION por defecto. COMPOSICION solo si la parte NO existe sin el todo (pedido -> linea_pedido). AGREGACION si la parte existe sola (equipo -> jugador). HERENCIA = hijo -> padre. Una N:M SIEMPRE es ASOCIACION.

            RELACIONES MUCHOS A MUCHOS (N:M) Y TABLA INTERMEDIA:
            - El sistema crea SOLO la tabla intermedia al aplicar una relación N:M: se llama origen_destino (ej. CREAR_RELACION: [docente] -> [grupo] (UNO_O_MAS a UNO_O_MAS) ASOCIACION crea "docente_grupo" con docente_id y grupo_id como PK compuesta y FK).
            - PROHIBIDO crear esa tabla con CREAR_TABLA, relacionarla a mano o modelar la N:M con COMPOSICION o con dos relaciones 1:N: quedaría duplicada.
            - Si la intermedia necesita datos propios (fecha, cantidad, nota, rol), emite DESPUÉS de la relación: AGREGAR_ATRIBUTO: [origen_destino] [campo:TIPO]. El sistema aplica las relaciones antes que los atributos.
            - Si en el estado actual ya hay una intermedia, agrégale columnas a esa; nunca crees otra para el mismo par de tablas.

            LIENZO Y ORDEN VISUAL:
            - Cada tabla mide 256 px de ancho y unos 52 + 28 px por atributo de alto. Deja al menos 120 px libres en horizontal y 100 px en vertical entre tablas: nunca las encimes.
            - Columnas sugeridas: x = 80, 460, 840, 1220; filas desde y = 80, separadas por la altura de la tabla más alta de la fila + 100.
            - Ubica cerca las tablas relacionadas: la tabla principal en el centro, sus dependientes alrededor y cada intermedia entre las dos tablas que une.
            - Para reordenar tablas EXISTENTES (cuando pidan ordenar, acomodar, mover, distribuir o "que no se encimen") emite una línea por tabla: MOVER_TABLA: [Tabla] (x: N, y: N). Incluye todas las tablas que cambian de lugar, también las intermedias. No uses CREAR_TABLA ni ELIMINAR_TABLA para mover.
            - Las tablas nuevas llevan su posición en CREAR_TABLA; elige lugares libres según las posiciones del estado actual.
            """.stripIndent().trim();

    private IaReglasModelado() {
    }
}
