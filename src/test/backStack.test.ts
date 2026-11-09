import { describe, expect, it } from 'vitest';
import { nextBackStack, type BackRules } from '@/lib/backStack';

type P = 'home' | 'profile' | 'history' | 'more' | 'sprint' | 'sprint-result' | 'race' | 'quizzes' | 'quiz-edit' | 'quiz-intro' | 'store' | 'invite' | 'lobby';

const menu: P[] = ['profile', 'history', 'more', 'sprint', 'quizzes', 'quiz-edit', 'quiz-intro', 'store', 'invite', 'lobby'];
const rules: BackRules<P> = {
  home: 'home',
  returns: new Set(menu),
  opens: new Set(menu),
  replaces: (prev, next) => (prev === 'quiz-edit' && next === 'quiz-intro') || (prev === 'invite' && next === 'lobby'),
};

/** Recorre una secuencia de pantallas y devuelve la pila final */
function walk(path: P[], tabs: P[] = []): P[] {
  let stack: P[] = [];
  for (let i = 1; i < path.length; i++) stack = nextBackStack(stack, path[i - 1], path[i], rules, tabs.includes(path[i]));
  return stack;
}

describe('pila de atrás', () => {
  it('Inicio → Perfil → Historial: atrás vuelve a Perfil y luego al Inicio', () => {
    expect(walk(['home', 'profile', 'history'])).toEqual(['profile']);
    expect(walk(['home', 'profile', 'history', 'profile'])).toEqual([]);
  });

  it('el Inicio vacía la pila y nunca se guarda', () => {
    expect(walk(['home', 'more'])).toEqual([]);
    expect(walk(['home', 'more', 'sprint', 'home'])).toEqual([]);
  });

  it('una pestaña de la barra es primer nivel: su atrás va al Inicio', () => {
    expect(walk(['home', 'more', 'sprint', 'store'], ['store'])).toEqual([]);
  });

  it('abrir Tienda desde Sprint (sin pestaña) vuelve a Sprint', () => {
    expect(walk(['home', 'more', 'sprint', 'store'])).toEqual(['more', 'sprint']);
  });

  it('una carrera y su resultado no ensucian la pila', () => {
    expect(walk(['home', 'more', 'sprint', 'race', 'sprint-result', 'sprint'])).toEqual(['more']);
  });

  it('guardar un quiz reemplaza el editor: atrás desde el quiz va a Mis quizzes', () => {
    expect(walk(['home', 'more', 'quizzes', 'quiz-edit', 'quiz-intro'])).toEqual(['more', 'quizzes']);
  });

  it('unirse por invitación reemplaza la invitación', () => {
    expect(walk(['home', 'more', 'invite', 'lobby'])).toEqual(['more']);
  });

  it('ir y volver entre dos pantallas no crea un ciclo', () => {
    expect(walk(['home', 'profile', 'history', 'profile', 'history', 'profile'])).toEqual([]);
  });
});
