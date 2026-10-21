import { describe, it, expect } from 'vitest';
import { layoutPills, rectAround, overlapArea, type PillRequest, type Rect } from '@/lib/mapLabels';

// Generador determinista (mismos casos en cada corrida)
function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

describe('etiquetas del mapa', () => {
  it('nunca quedan fuera del área visible, aunque los pines estén en el borde o en una esquina', () => {
    const r = rng(42);
    let outside = 0, cases = 0, clashes = 0;
    for (const [W, H] of [[800, 450], [600, 320], [390, 300], [1280, 640]]) {
      for (let i = 0; i < 150; i++) {
        // Pines cerca de los bordes (15 % de margen) y a veces juntos
        const edge = () => (r() < 0.5 ? r() * 0.15 : 0.85 + r() * 0.15);
        const you = { x: edge() * W, y: r() * H };
        const city = r() < 0.5 ? { x: you.x + (r() - 0.5) * 80, y: you.y + (r() - 0.5) * 60 } : { x: r() * W, y: edge() * H };
        const rival = { x: edge() * W, y: edge() * H };
        const cover = r() < 0.5 ? 0.4 : 0; // tarjeta de respuesta a la derecha
        const area: Rect = { x: 4, y: 4, w: W * (1 - cover) - 8, h: H - 8 };
        const reqs: PillRequest[] = [
          { key: 'correct', w: 128, h: 26, anchor: city, r: 17, away: you, prefer: -1 },
          { key: 'you', w: 112, h: 26, anchor: you, r: 12, away: city, prefer: 1 },
          { key: 'rival', w: 150, h: 26, anchor: rival, r: 11, away: city, prefer: -1 },
        ];
        const pills = layoutPills(reqs, [rectAround(you, 12), rectAround(city, 17), rectAround(rival, 11)], [], area);
        cases++;
        for (const p of pills) {
          const inside = overlapArea(p.rect, area) >= p.rect.w * p.rect.h - 0.5;
          if (!inside) outside++;
        }
        for (let a = 0; a < pills.length; a++) for (let b = a + 1; b < pills.length; b++) if (overlapArea(pills[a].rect, pills[b].rect) > 150) clashes++;
      }
    }
    expect(cases).toBe(600);
    expect(outside).toBe(0);
    // Entre sí casi nunca se tapan (casos extremos: tres pines en esquinas con la tarjeta encima)
    expect(clashes).toBeLessThanOrEqual(6);
  });

  it('una etiqueta de un pin pegado al borde queda adentro', () => {
    const area: Rect = { x: 0, y: 0, w: 400, h: 300 };
    const pin = { x: 396, y: 150 }; // pegado al borde derecho
    const [p] = layoutPills([{ key: 'you', w: 120, h: 26, anchor: pin, r: 12, prefer: 1 }], [rectAround(pin, 12)], [], area);
    expect(p.rect.x + p.rect.w).toBeLessThanOrEqual(400);
  });
});
