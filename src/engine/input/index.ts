import type { InputManager, PointerState } from '../contracts';

export function createInputManager(canvas: HTMLCanvasElement): InputManager & { update(): void; destroy(): void } {
  const keysDown = new Set<string>();
  const keysJustPressed = new Set<string>();
  const keysJustReleased = new Set<string>();

  // Buffers: events arrive between frames, we buffer them
  const pendingDown = new Set<string>();
  const pendingUp = new Set<string>();

  let pointerDown = false;
  let pointerX = 0;
  let pointerY = 0;
  let pointerJustPressed = false;
  let pointerJustReleased = false;
  let pendingPointerDown = false;
  let pendingPointerUp = false;
  let pendingPointerX = 0;
  let pendingPointerY = 0;

  // ── Keyboard listeners ──

  function onKeyDown(e: KeyboardEvent): void {
    if (!keysDown.has(e.key)) {
      pendingDown.add(e.key);
    }
    keysDown.add(e.key);
  }

  function onKeyUp(e: KeyboardEvent): void {
    keysDown.delete(e.key);
    pendingUp.add(e.key);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ── Pointer listeners ──

  function updatePointerPos(e: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    pendingPointerX = e.clientX - rect.left;
    pendingPointerY = e.clientY - rect.top;
  }

  function onPointerDown(e: PointerEvent): void {
    updatePointerPos(e);
    pendingPointerDown = true;
    pointerDown = true;
  }

  function onPointerMove(e: PointerEvent): void {
    updatePointerPos(e);
  }

  function onPointerUp(e: PointerEvent): void {
    updatePointerPos(e);
    pendingPointerUp = true;
    pointerDown = false;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // ── Pointer state object ──

  const pointer: PointerState = {
    get down() { return pointerDown; },
    get x() { return pointerX; },
    get y() { return pointerY; },
    get justPressed() { return pointerJustPressed; },
    get justReleased() { return pointerJustReleased; },
  };

  // ── Per-frame update ──

  function update(): void {
    // Flush keyboard buffers
    keysJustPressed.clear();
    keysJustReleased.clear();
    for (const k of pendingDown) keysJustPressed.add(k);
    for (const k of pendingUp) keysJustReleased.add(k);
    pendingDown.clear();
    pendingUp.clear();

    // Flush pointer buffers
    pointerX = pendingPointerX;
    pointerY = pendingPointerY;
    pointerJustPressed = pendingPointerDown;
    pointerJustReleased = pendingPointerUp;
    pendingPointerDown = false;
    pendingPointerUp = false;
  }

  function destroy(): void {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    keysDown.clear();
    keysJustPressed.clear();
    keysJustReleased.clear();
  }

  return {
    isKeyDown(key: string): boolean { return keysDown.has(key); },
    isKeyJustPressed(key: string): boolean { return keysJustPressed.has(key); },
    isKeyJustReleased(key: string): boolean { return keysJustReleased.has(key); },
    get pointer() { return pointer; },
    get keysDown(): ReadonlySet<string> { return keysDown; },
    update,
    destroy,
  };
}
