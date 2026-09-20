/** Mismo criterio de color/grosor que usa `UmlRelationEdge` para su `<BaseEdge>` — extraído acá
 * para que `RelationCrossingOverlay` pueda pintar el "salto" de una línea con un color parecido
 * al real (no hay forma de leer el estilo ya calculado de otra arista sin recalcularlo). */
export function colorLineaRelacion(selected?: boolean, resaltada?: boolean): string {
  if (selected) return "var(--destructive)"
  if (resaltada) return "var(--primary)"
  return "var(--muted-foreground)"
}

export function anchoLineaRelacion(selected?: boolean, resaltada?: boolean): number {
  if (selected) return 2.5
  if (resaltada) return 2
  return 1.5
}
