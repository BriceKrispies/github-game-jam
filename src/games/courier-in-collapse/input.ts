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

  // Key repeat
  let repeatId: number | null = null;
  const REPEAT_DELAY = 120;

  function startRepeat(): void {
    stopRepeat();
    repeatId = window.setInterval(() => {
      if (isGameOver()) return;
      for (const key of heldKeys) {
        const dir = keyMap[key];
        if (dir) { onDirection(dir); break; }
      }
    }, REPEAT_DELAY);
  }

  function stopRepeat(): void {
    if (repeatId !== null) { clearInterval(repeatId); repeatId = null; }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  startRepeat();

  // D-pad
  const dpad = createDpad(container, onDirection, onRestart, isGameOver);

  // Swipe input on the canvas
  const swipe = createSwipeHandler(container, onDirection, onRestart, isGameOver);

  return function destroy(): void {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    heldKeys.clear();
    stopRepeat();
    dpad.destroy();
    swipe.destroy();
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
      if (isGameOver()) { onRestart(); return; }
      onDirection(dir);
      repeatTimer = window.setInterval(() => {
        if (!isGameOver()) onDirection(dir);
      }, 120);
    });

    const stop = () => {
      if (repeatTimer !== null) { clearInterval(repeatTimer); repeatTimer = null; }
    };

    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('pointerleave', stop);

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

function createSwipeHandler(
  container: HTMLElement,
  onDirection: DirectionCallback,
  onRestart: RestartCallback,
  isGameOver: () => boolean,
) {
  let startX = 0;
  let startY = 0;
  let tracking = false;
  const THRESHOLD = 20;

  function onTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    // Don't capture touches on the d-pad
    const target = e.target as HTMLElement;
    if (target.closest('.courier-dpad')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }

  function onTouchEnd(e: TouchEvent): void {
    if (!tracking) return;
    tracking = false;
    if (e.changedTouches.length === 0) return;

    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < THRESHOLD && absDy < THRESHOLD) {
      // Tap — restart if game over
      if (isGameOver()) onRestart();
      return;
    }

    if (isGameOver()) { onRestart(); return; }

    if (absDx > absDy) {
      onDirection(dx > 0 ? Direction.Right : Direction.Left);
    } else {
      onDirection(dy > 0 ? Direction.Down : Direction.Up);
    }
  }

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchend', onTouchEnd, { passive: true });

  return {
    destroy() {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    },
  };
}
