import { describe, it, expect, beforeEach, vi } from 'vitest';

// Pro = vidas infinitas: el sistema de vidas lo consulta al cobrar y al devolver.
let pro = false;
vi.mock('../lib/premiumSystem', () => ({ isPro: () => pro }));

import { consumeLife, getEnergy, refundLife, drainLives, addLives } from '../lib/energySystem';

describe('vidas con Pro', () => {
  beforeEach(() => { localStorage.clear(); pro = false; });

  it('sin Pro: se gastan y al llegar a 0 no deja jugar', () => {
    drainLives();
    expect(consumeLife()).toBe(false);
    expect(getEnergy().unlimited).toBe(false);
  });

  it('con Pro: juega aunque tenga 0 vidas y no se gasta ninguna', () => {
    addLives(2);
    pro = true;
    const before = getEnergy().lives;
    expect(consumeLife()).toBe(true);
    expect(consumeLife()).toBe(true);
    expect(getEnergy().lives).toBe(before);
    expect(getEnergy().unlimited).toBe(true);
    drainLives();
    expect(consumeLife()).toBe(true);
  });

  it('con Pro: cancelar no suma una vida que no se cobró', () => {
    drainLives();
    pro = true;
    refundLife();
    expect(getEnergy().lives).toBe(0);
    pro = false;
    refundLife();
    expect(getEnergy().lives).toBe(1);
  });
});
