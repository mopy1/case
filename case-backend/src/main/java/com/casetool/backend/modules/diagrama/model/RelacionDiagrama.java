package com.casetool.backend.modules.diagrama.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.type.SqlTypes;

import com.casetool.backend.modules.proyecto.model.Proyecto;

import jakarta.persistence.*;
import lombok.*;

/** Una conexion entre dos {@link EntidadDiagrama} — arista (Edge) en el lienzo. */
@Entity
@Table(name = "diagrama_relaciones")
@Getter
@Setter
@NoArgsConstructor
public class RelacionDiagrama {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proyecto_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Proyecto proyecto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_origen_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EntidadDiagrama entidadOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entidad_destino_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private EntidadDiagrama entidadDestino;

    /**
     * Multiplicidad de cada lado, guardada de forma independiente (2026-09-19, reemplaza a
     * `tipoRelacion` + `opcionalOrigen`/`opcionalDestino`). El modelo anterior obligaba a
     * re-derivar el "tipo" de relación y, peor, a invertir origen/destino cada vez que un lado
     * pasaba de "uno" a "muchos" (necesario porque `UNO_A_MUCHOS` siempre asumía que el origen
     * era el lado "1") — con el editor del frontend permitiendo tocar cada lado por separado,
     * esa inversión se disparaba todo el tiempo sin necesidad real. Guardando la cardinalidad de
     * cada lado tal cual, origen/destino no se tocan nunca por esto.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "multiplicidad_origen", nullable = false, length = 20)
    private Multiplicidad multiplicidadOrigen;

    @Enumerated(EnumType.STRING)
    @Column(name = "multiplicidad_destino", nullable = false, length = 20)
    private Multiplicidad multiplicidadDestino;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Puntos de control manuales para redirigir la línea a mano en el lienzo (2026-09-20, pedido
     * explícito: "quiero manipular las relaciones a libertad... que pasen por otro lado") — lista
     * vacía por default (ruteo 100% automático, floating edge puro). Persistidos como JSON crudo:
     * no hace falta una entidad/tabla separada para 2 doubles por punto.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "puntos_control", columnDefinition = "jsonb")
    private List<PuntoControl> puntosControl = new ArrayList<>();

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    /** N:M real (ambos lados admiten más de una instancia relacionada) — antes era
     * `tipoRelacion == MUCHOS_A_MUCHOS`, ahora se deriva de los dos lados en vez de guardarse
     * aparte. Dispara la creación de la tabla intermedia, ver `RelacionDiagramaService`. */
    public boolean esMuchosAMuchos() {
        return !multiplicidadOrigen.esUno() && !multiplicidadDestino.esUno();
    }

    public enum Multiplicidad {
        UNO, CERO_O_UNO, UNO_O_MAS, CERO_O_MAS;

        /** true si el tope de este lado es 1 (`UNO`/`CERO_O_UNO`), false si es N (`UNO_O_MAS`/
         * `CERO_O_MAS`) — el "0" opcional es ortogonal a esto, ver los 4 valores del enum. */
        public boolean esUno() {
            return this == UNO || this == CERO_O_UNO;
        }
    }
}
