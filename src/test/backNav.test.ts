import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, useState } from 'react';
import { act, render } from '@testing-library/react';
import { BACK_LAYER, __resetBackNavForTests, hasBackAction, initBackNavigation, pushBackHandler, runBack, useBackHandler } from '@/lib/backNav';
import { publicOrigin } from '@/lib/assetUrl';

const tick = () => new Promise((r) => setTimeout(r, 0));
/** jsdom recorre el historial en una tarea aparte: espera a que llegue el popstate */
const settle = async () => { for (let i = 0; i < 5; i++) await tick(); };

describe('backNav: qué acción gana', () => {
  beforeEach(() => __resetBackNavForTests());

  it('sin acciones no hace nada (Inicio)', () => {
    expect(hasBackAction()).toBe(false);
    expect(runBack()).toBe(false);
  });

  it('gana la capa más alta y, en la misma capa, la última', () => {
    const calls: string[] = [];
    const offScreen = pushBackHandler(() => calls.push('pantalla'), BACK_LAYER.screen);
    const offFallback = pushBackHandler(() => calls.push('respaldo'), BACK_LAYER.fallback);
    const offModal = pushBackHandler(() => calls.push('ventana'), BACK_LAYER.modal);
    const offSub = pushBackHandler(() => calls.push('subpantalla'), BACK_LAYER.screen);
    runBack();
    offModal();
    runBack();
    offSub();
    runBack();
    offScreen();
    runBack();
    offFallback();
    expect(runBack()).toBe(false);
    expect(calls).toEqual(['ventana', 'subpantalla', 'pantalla', 'respaldo']);
  });

  it('un error en una acción no rompe el botón', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const off = pushBackHandler(() => { throw new Error('x'); });
    expect(runBack()).toBe(true);
    off();
    spy.mockRestore();
  });
});

describe('useBackHandler', () => {
  beforeEach(() => __resetBackNavForTests());

  it('registra mientras está montado y activo, y llama siempre al último handler', () => {
    const calls: number[] = [];
    let setN: (n: number) => void = () => {};
    let setOn: (b: boolean) => void = () => {};
    function Screen() {
      const [n, _setN] = useState(1);
      const [on, _setOn] = useState(true);
      setN = _setN;
      setOn = _setOn;
      useBackHandler(() => calls.push(n), { active: on });
      return null;
    }
    const { unmount } = render(createElement(Screen));
    runBack();
    act(() => setN(2));
    runBack();
    act(() => setOn(false));
    expect(runBack()).toBe(false);
    act(() => setOn(true));
    runBack();
    unmount();
    expect(runBack()).toBe(false);
    expect(calls).toEqual([1, 2, 2]);
  });

  it('una ventana abierta encima de la pantalla se cierra primero', () => {
    const calls: string[] = [];
    let open: (b: boolean) => void = () => {};
    function Modal({ onClose }: { onClose: () => void }) {
      useBackHandler(onClose, { layer: BACK_LAYER.modal });
      return null;
    }
    function Screen() {
      const [isOpen, setOpen] = useState(false);
      open = setOpen;
      useBackHandler(() => calls.push('pantalla'));
      return isOpen ? createElement(Modal, { onClose: () => { calls.push('ventana'); setOpen(false); } }) : null;
    }
    render(createElement(Screen));
    act(() => open(true));
    act(() => { runBack(); });
    act(() => { runBack(); });
    expect(calls).toEqual(['ventana', 'pantalla']);
  });
});

describe('backNav en el navegador (centinela en el historial)', () => {
  beforeEach(() => __resetBackNavForTests());
  afterEach(() => __resetBackNavForTests());

  it('pone un centinela mientras hay a dónde volver, lo usa y lo retira al llegar al Inicio', async () => {
    initBackNavigation();
    const start = window.history.length;
    const calls: string[] = [];
    let off = pushBackHandler(() => { calls.push('volver'); off(); });
    await settle();
    expect((window.history.state as Record<string, unknown>)?.gsBack).toBe(true);
    expect(window.history.length).toBe(start + 1);

    // El usuario toca "atrás": se ejecuta la acción y, sin más a dónde volver, no se pone otro centinela
    window.history.back();
    await settle();
    expect(calls).toEqual(['volver']);
    expect((window.history.state as Record<string, unknown> | null)?.gsBack).toBeFalsy();

    // Con los botones del juego (sin "atrás" del navegador): al quedar sin acciones el centinela se retira solo
    off = pushBackHandler(() => calls.push('otra'));
    await settle();
    expect((window.history.state as Record<string, unknown>)?.gsBack).toBe(true);
    off();
    await settle();
    expect((window.history.state as Record<string, unknown> | null)?.gsBack).toBeFalsy();
    expect(calls).toEqual(['volver']);
  });

  it('fuera del juego (/auth) no pone centinela: el historial normal del navegador manda', async () => {
    initBackNavigation();
    window.history.pushState({}, '', '/auth');
    const off = pushBackHandler(() => {});
    await settle();
    expect((window.history.state as Record<string, unknown> | null)?.gsBack).toBeFalsy();
    off();
    window.history.replaceState({}, '', '/');
    await settle();
  });

  it('volver al Inicio con replaceState (navigate replace) conserva la marca para poder retirarla', async () => {
    initBackNavigation();
    const off = pushBackHandler(() => {});
    await settle();
    window.history.replaceState({ usr: null, key: 'k', idx: 0 }, '', '/');
    expect((window.history.state as Record<string, unknown>)?.gsBack).toBe(true);
    off();
    await settle();
    expect((window.history.state as Record<string, unknown> | null)?.gsBack).toBeFalsy();
  });
});

describe('publicOrigin', () => {
  it('en la web usa el origen actual', () => {
    expect(publicOrigin()).toBe(window.location.origin);
  });
  it('en la app nativa usa el sitio publicado (https://localhost no abre en otro teléfono)', () => {
    (window as unknown as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true };
    try {
      expect(publicOrigin()).toBe('https://geospeed-challenge.vercel.app');
    } finally {
      delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    }
  });
});
