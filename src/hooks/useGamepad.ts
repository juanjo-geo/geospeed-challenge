import { useState, useEffect, useRef, useCallback } from 'react';

export type GamepadAction =
  | 'confirm'
  | 'cancel'
  | 'advance'
  | 'hint'
  | 'zoom_in'
  | 'zoom_out'
  | 'start';

export interface GamepadState {
  connected: boolean;
  name: string | null;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
}

const DEADZONE = 0.15;

/** Standard gamepad button indices */
const BUTTON_MAP: Record<number, GamepadAction> = {
  0: 'confirm',   // A
  1: 'cancel',    // B
  2: 'advance',   // X
  3: 'hint',      // Y
  4: 'zoom_out',  // LB
  5: 'zoom_in',   // RB
  9: 'start',     // Start
};

function applyDeadzone(value: number): number {
  return Math.abs(value) < DEADZONE ? 0 : value;
}

/**
 * Hook for gamepad input with rAF polling loop.
 *
 * - Detects gamepad connection/disconnection
 * - Polls axes with deadzone (0.15)
 * - Debounces button presses (fires on press, not hold)
 * - Graceful no-op if Gamepad API is unavailable
 */
export function useGamepad(onAction?: (action: GamepadAction) => void): GamepadState {
  const [state, setState] = useState<GamepadState>({
    connected: false,
    name: null,
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
  });

  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const prevButtonsRef = useRef<Record<number, boolean>>({});
  const rafRef = useRef<number>(0);
  const connectedRef = useRef(false);

  const handleConnected = useCallback((e: GamepadEvent) => {
    connectedRef.current = true;
    setState(prev => ({ ...prev, connected: true, name: e.gamepad.id }));
  }, []);

  const handleDisconnected = useCallback(() => {
    connectedRef.current = false;
    prevButtonsRef.current = {};
    setState({
      connected: false,
      name: null,
      leftStick: { x: 0, y: 0 },
      rightStick: { x: 0, y: 0 },
    });
  }, []);

  useEffect(() => {
    // Graceful no-op if Gamepad API not available
    if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) {
      return;
    }

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Check if a gamepad is already connected on mount
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (gp) {
        connectedRef.current = true;
        setState(prev => ({ ...prev, connected: true, name: gp.id }));
        break;
      }
    }

    function poll() {
      rafRef.current = requestAnimationFrame(poll);

      if (!connectedRef.current) return;

      const gamepads = navigator.getGamepads();
      let gp: Gamepad | null = null;
      for (const g of gamepads) {
        if (g) { gp = g; break; }
      }
      if (!gp) return;

      // --- Axes ---
      const leftX = applyDeadzone(gp.axes[0] ?? 0);
      const leftY = applyDeadzone(gp.axes[1] ?? 0);
      const rightX = applyDeadzone(gp.axes[2] ?? 0);
      const rightY = applyDeadzone(gp.axes[3] ?? 0);

      setState(prev => {
        // Only update if values actually changed (avoid unnecessary re-renders)
        if (
          prev.leftStick.x === leftX &&
          prev.leftStick.y === leftY &&
          prev.rightStick.x === rightX &&
          prev.rightStick.y === rightY
        ) {
          return prev;
        }
        return {
          ...prev,
          leftStick: { x: leftX, y: leftY },
          rightStick: { x: rightX, y: rightY },
        };
      });

      // --- Buttons (debounced: fire on press edge only) ---
      const prev = prevButtonsRef.current;
      for (const [indexStr, action] of Object.entries(BUTTON_MAP)) {
        const index = Number(indexStr);
        const pressed = gp.buttons[index]?.pressed ?? false;
        const wasPrevPressed = prev[index] ?? false;

        if (pressed && !wasPrevPressed) {
          onActionRef.current?.(action);
        }
        prev[index] = pressed;
      }
    }

    rafRef.current = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, [handleConnected, handleDisconnected]);

  return state;
}
