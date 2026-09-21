export function UmlRelationMarkers() {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
      <defs>
        {/* Rombo relleno para Composición (va en el origen, se proyecta sobre la línea saliente) */}
        <marker
          id="uml-marker-composition"
          viewBox="0 0 24 24"
          refX="0"
          refY="12"
          markerWidth="18"
          markerHeight="18"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="0,12 10,5 20,12 10,19"
            className="fill-foreground stroke-foreground"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </marker>

        {/* Rombo hueco para Agregación (va en el origen, con fondo para cubrir la línea subyacente) */}
        <marker
          id="uml-marker-aggregation"
          viewBox="0 0 24 24"
          refX="0"
          refY="12"
          markerWidth="18"
          markerHeight="18"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="0,12 10,5 20,12 10,19"
            className="fill-card stroke-foreground"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </marker>

        {/* Triángulo para Herencia (va en el destino, punta en refX=20 tocando la tabla destino) */}
        <marker
          id="uml-marker-inheritance"
          viewBox="0 0 24 24"
          refX="20"
          refY="12"
          markerWidth="18"
          markerHeight="18"
          orient="auto"
          overflow="visible"
        >
          <polygon
            points="3,4 20,12 3,20"
            className="fill-card stroke-foreground"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  )
}
