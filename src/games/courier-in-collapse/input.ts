import { Direction } from './types';

export type DirectionCallback = (dir: Direction) => void;
export type RestartCallback = () => void;

export function createInputHandler(
  container: HTMLElement,
  onDirection: DirectionCallback,
  onRestart: RestartCallback,
  isGameOver: () => boolean,
) {
  const keyMap: Record<string, Direction> = {
    ArrowUp: Direction.Up,
    ArrowDown: Direction.Down,
    ArrowLeft: Direction.Left,
    ArrowRight: Direction.Right,
    w: Direction.Up,
    W: Direction.Up,
    s: Direction.Down,
    S: Direction.Down,
    a: Direction.Left,
    A: Direction.Left,
    d: Direction.Right,
    D: Direction.Right,
  };

  const heldKeys = new Set<string>();

  function handleKeyDown(e: KeyboardEvent): void {
    if (isGameOver()) {
      onRestart();
      e.preventDefault();
      return;
    }
    const dir = keyMap[e.key];
    if (dir) {
      e.preventDefault();
      heldKeys.add(e.key);
      onDirection(dir);
    }
  }

  function handleKeyUp(e: KeyboardEvent): void {
    heldKeys.delete(e.key);
  }

  // Repeat movement for held keys
  let repeatId: number | null = null;
  const REPEAT_DELAY = 150;

  function startRepeat(): void {
    stopRepeat();
    repeatId = window.setInterval(() => {
      if (isGameOver()) return;
      for (const key of heldKeys) {
        const dir = keyMap[key];
        if (dir) {
          onDirection(dir);
          break; // Only process one direction at a time
        }
      }
    }, REPEAT_DELAY);
  }

  function stopRepeat(): void {
    if (repeatId !== null) {
      clearInterval(repeatId);
      repeatId = null;
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  startRepeat();

  // Mobile D-pad
  const dpad = createDpad(container, onDirection, onRestart, isGameOver);

  return function destroy(): void {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    heldKeys.clear();
    stopRepeat();
    dpad.destroy();
  };
}

function createDpad(
  container: HTMLElement,
  onDirection: DirectionCallback,
  onRestart: RestartCallback,
  isGameOver: () => boolean,
) {
  const dpad = document.createElement('div');
  dpad.className = 'courier-dpad';
  dpad.setAttribute('aria-label', 'Directional controls');

  const dirs: [Direction, string, string][] = [
    [Direction.Up, 'dpad-up', '\u25B2'],
    [Direction.Left, 'dpad-left', '\u25C0'],
    [Direction.Right, 'dpad-right', '\u25B6'],
    [Direction.Down, 'dpad-down', '\u25BC'],
  ];

  const center = document.createElement('div');
  center.className = 'dpad-center';
  dpad.appendChild(center);

  let repeatTimer: number | null = null;

  for (const [dir, cls, symbol] of dirs) {
    const btn = document.createElement('button');
    btn.className = `dpad-btn ${cls}`;
    btn.textContent = symbol;
    btn.setAttribute('aria-label', dir);
    btn.type = 'button';

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (isGameOver()) {
        onRestart();
        return;
      }
      onDirection(dir);
      // Repeat on hold
      repeatTimer = window.setInterval(() => {
        if (!isGameOver()) onDirection(dir);
      }, 150);
    });

    const stopRepeat = () => {
      if (repeatTimer !== null) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    };

    btn.addEventListener('pointerup', stopRepeat);
    btn.addEventListener('pointercancel', stopRepeat);
    btn.addEventListener('pointerleave', stopRepeat);

    dpad.appendChild(btn);
  }

  container.appendChild(dpad);

  return {
    destroy() {
      if (repeatTimer !== null) clearInterval(repeatTimer);
      dpad.remove();
    },
  };
}
