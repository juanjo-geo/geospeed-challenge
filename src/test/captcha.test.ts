/** Turnstile (punto 10): sin clave no hace nada; con clave, un token nuevo por llamada y la ventana solo si hace falta. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { captchaEnabled, getCaptchaToken, isCaptchaError } from '@/lib/captcha';

type Opts = Record<string, (arg?: string) => void>;
const w = window as unknown as { turnstile?: unknown };
const layer = () => document.querySelector<HTMLElement>('[data-captcha]');

afterEach(() => {
  vi.unstubAllEnvs();
  delete w.turnstile;
  document.querySelectorAll('[data-captcha], script[src*="challenges.cloudflare.com"]').forEach((n) => n.remove());
});

describe('captcha (Turnstile)', () => {
  it('sin clave no carga nada y devuelve undefined', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
    expect(captchaEnabled()).toBe(false);
    expect(await getCaptchaToken('login')).toBeUndefined();
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
    expect(layer()).toBeNull();
  });

  it('con clave pide un widget nuevo por llamada, lo quita al terminar y muestra la ventana solo si hay que interactuar', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
    const rendered: Opts[] = [];
    const removed: string[] = [];
    let visibleDuringInteraction = '';
    w.turnstile = {
      render: (_el: HTMLElement, o: Opts) => {
        rendered.push(o);
        const n = rendered.length;
        setTimeout(() => {
          if (n === 2) { o['before-interactive-callback'](); visibleDuringInteraction = layer()?.style.visibility ?? ''; o['after-interactive-callback'](); }
          o.callback(`token-${n}`);
        }, 0);
        return `w${n}`;
      },
      remove: (id: string) => removed.push(id),
    };
    expect(captchaEnabled()).toBe(true);
    expect(await getCaptchaToken('guest')).toBe('token-1');
    expect(layer()?.style.visibility).toBe('hidden');
    expect(await getCaptchaToken('login')).toBe('token-2');
    expect(visibleDuringInteraction).toBe('visible');
    expect(layer()?.style.visibility).toBe('hidden');
    expect(removed).toEqual(['w1', 'w2']);
    expect(rendered.map((o) => o.action)).toEqual(['guest', 'login']);
    expect(rendered[0].sitekey).toBe('1x00000000000000000000AA');
    expect(rendered[0].appearance).toBe('interaction-only');
  });

  it('si Cloudflare falla devuelve undefined y cierra la ventana', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
    w.turnstile = {
      render: (_el: HTMLElement, o: Opts) => { setTimeout(() => { o['before-interactive-callback'](); o['error-callback'](); }, 0); return 'w1'; },
      remove: () => {},
    };
    expect(await getCaptchaToken('signup')).toBeUndefined();
    expect(layer()?.style.visibility).toBe('hidden');
  });

  it('reconoce el error de CAPTCHA de Supabase', () => {
    expect(isCaptchaError('captcha protection: request disallowed (captcha verification process failed)')).toBe(true);
    expect(isCaptchaError('Invalid login credentials')).toBe(false);
    expect(isCaptchaError(undefined)).toBe(false);
  });
});
