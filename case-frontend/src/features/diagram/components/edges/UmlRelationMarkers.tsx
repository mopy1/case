export function UmlRelationMarkers() {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
      <defs>
        {/* Rombo relleno para Composición (va en el origen) */}
        <marker
          id="uml-marker-composition"
          viewBox="0 0 20 20"
          refX="10"
          refY="10"
          markerWidth="14"
          markerHeight="14"
          orient="auto-start-reverse"
        >
          <polygon
            points="10,2 18,10 10,18 2,10"
            className="fill-foreground stroke-foreground"
            strokeWidth="1.5"
          />
        </marker>

        {/* Rombo hueco para Agregación (va en el origen) */}
        <marker
          id="uml-marker-aggregation"
          viewBox="0 0 20 20"
          refX="10"
          refY="10"
          markerWidth="14"
          markerHeight="14"
          orient="auto-start-reverse"
        >
          <polygon
            points="10,2 18,10 10,18 2,10"
            className="fill-background stroke-foreground"
            strokeWidth="1.5"
          />
        </marker>

        {/* Triángulo hueco para Herencia / Generalización (apunta al destino) */}
        <marker
          id="uml-marker-inheritance"
          viewBox="0 0 20 20"
          refX="17"
          refY="10"
          markerWidth="14"
          markerHeight="14"
          orient="auto"
        >
          <polygon
            points="3,3 17,10 3,17"
            className="fill-background stroke-foreground"
            strokeWidth="1.5"
          />
        </marker>
      </defs>
    </svg>
  )
}
