import { Dir } from './types';

export type DirCallback = (dir: Dir | null) => void;
export type ActionCallback = () => void;

export function createInput(
  container: HTMLElement,
  onDir: DirCallback,
  onAttack: ActionCallback,
  onRestart: ActionCallback,
  isGameOver: () => boolean,
) {
  const keyToDir: Record<string, Dir> = {
    ArrowUp: Dir.Up, ArrowDown: Dir.Down, ArrowLeft: Dir.Left, ArrowRight: Dir.Right,
    w: Dir.Up, W: Dir.Up, s: Dir.Down, S: Dir.Down,
    a: Dir.Left, A: Dir.Left, d: Dir.Right, D: Dir.Right,
  };

  const held = new Set<string>();

  function updateHeld(): void {
    // Last pressed direction wins
    for (const key of [...held].reverse()) {
      const d = keyToDir[key];
      if (d !== undefined) { onDir(d); return; }
    }
    onDir(null);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (isGameOver()) {
      if (e.key === ' ' || e.key === 'Enter') { onRestart(); e.preventDefault(); }
      return;
    }
    if (keyToDir[e.key] !== undefined) {
      e.preventDefault();
      held.add(e.key);
      updateHeld();
    }
    if (e.key === ' ' || e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      onAttack();
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    held.delete(e.key);
    updateHeld();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Mobile controls
  const controls = createMobileControls(container, onDir, onAttack, onRestart, isGameOver);

  return function destroy(): void {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    held.clear();
    controls.destroy();
  };
}

function createMobileControls(
  container: HTMLElement,
  onDir: DirCallback,
  onAttack: ActionCallback,
  onRestart: ActionCallback,
  isGameOver: () => boolean,
) {
  const wrap = document.createElement('div');
  wrap.className = 'tp-controls';

  // D-pad (left side)
  const dpad = document.createElement('div');
  dpad.className = 'tp-dpad';

  const dirs: [Dir, string, string][] = [
    [Dir.Up, 'tp-up', '\u25B2'],
    [Dir.Left, 'tp-left', '\u25C0'],
    [Dir.Right, 'tp-right', '\u25B6'],
    [Dir.Down, 'tp-down', '\u25BC'],
  ];

  const center = document.createElement('div');
  center.className = 'tp-dpad-center';
  dpad.appendChild(center);

  for (const [dir, cls, sym] of dirs) {
    const btn = document.createElement('button');
    btn.className = `tp-dir ${cls}`;
    btn.textContent = sym;
    btn.type = 'button';

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (isGameOver()) { onRestart(); return; }
      onDir(dir);
    });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); onDir(null); });
    btn.addEventListener('pointercancel', () => onDir(null));
    btn.addEventListener('pointerleave', () => onDir(null));

    dpad.appendChild(btn);
  }

  // Attack button (right side)
  const atkBtn = document.createElement('button');
  atkBtn.className = 'tp-attack-btn';
  atkBtn.textContent = 'POP';
  atkBtn.type = 'button';
  atkBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (isGameOver()) { onRestart(); return; }
    onAttack();
  });

  wrap.appendChild(dpad);
  wrap.appendChild(atkBtn);
  container.appendChild(wrap);

  return {
    destroy() { wrap.remove(); },
  };
}
