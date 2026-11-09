/**
 * Pila del botón "atrás" entre pantallas del menú: guarda de dónde se vino para volver a la pantalla anterior
 * (Perfil → Historial → atrás = Perfil) en vez de saltar al Inicio.
 *
 * El Inicio nunca se guarda: la pila vacía ya significa "volver al Inicio".
 */
export interface BackRules<P> {
  home: P;
  /** Pantallas a las que se puede volver */
  returns: ReadonlySet<P>;
  /** Pantallas que, al abrirse, dejan guardada la anterior */
  opens: ReadonlySet<P>;
  /** Pasos que reemplazan la pantalla en vez de apilarla (guardar un quiz → ver el quiz) */
  replaces?: (prev: P, next: P) => boolean;
}

/** Pila después de pasar de `prev` a `next`. Las pestañas de la barra (`isTab`) son primer nivel: la vacían. */
export function nextBackStack<P>(stack: readonly P[], prev: P, next: P, rules: BackRules<P>, isTab = false): P[] {
  if (next === rules.home || isTab) return [];
  // Volver a una pantalla que ya estaba abierta: se recorta hasta ella (también evita ciclos entre dos pantallas)
  const seen = stack.lastIndexOf(next);
  if (seen >= 0) return stack.slice(0, seen);
  if (rules.returns.has(prev) && rules.opens.has(next) && !rules.replaces?.(prev, next)) return [...stack, prev];
  return [...stack];
}
