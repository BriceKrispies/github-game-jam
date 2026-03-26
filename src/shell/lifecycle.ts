import type { RegistryEntry } from '../types/registry';
import { createEngineHost } from '../engine';
import type { EngineHost } from '../engine';

let engine: EngineHost | null = null;
let activeContainer: HTMLElement | null = null;

export async function mountGame(
  entry: RegistryEntry,
  viewport: HTMLElement,
): Promise<boolean> {
  await unmountCurrentGame();

  const container = document.createElement('div');
  container.className = 'game-container';
  container.setAttribute('data-game', entry.id);
  container.setAttribute('aria-label', entry.name);
  viewport.innerHTML = '';
  viewport.appendChild(container);

  try {
    const { default: gameDef } = await entry.load();

    engine = createEngineHost();
    await engine.start(container, gameDef);
    activeContainer = container;
    return true;
  } catch (err) {
    console.error(`[shell] Failed to mount game "${entry.id}":`, err);
    viewport.innerHTML = '';
    return false;
  }
}

export async function unmountCurrentGame(): Promise<void> {
  if (!engine) return;

  try {
    await engine.stop();
  } catch (err) {
    console.error('[shell] Error during game unmount:', err);
  }

  activeContainer?.remove();
  engine = null;
  activeContainer = null;
}

export function pauseCurrentGame(): void {
  if (engine?.running) {
    try {
      engine.pause();
    } catch (err) {
      console.error('[shell] Error during game pause:', err);
    }
  }
}

export function resumeCurrentGame(): void {
  if (engine) {
    try {
      engine.resume();
    } catch (err) {
      console.error('[shell] Error during game resume:', err);
    }
  }
}

export function isMounted(): boolean {
  return engine !== null && engine.running;
}
