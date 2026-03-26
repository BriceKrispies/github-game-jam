import type { GameModule } from '../types/game';
import type { RegistryEntry } from '../types/registry';
import { createSharedServices } from './services';

interface MountedGame {
  module: GameModule;
  container: HTMLElement;
}

let mounted: MountedGame | null = null;

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
    const { default: gameModule } = await entry.load();
    const services = createSharedServices(entry.id, container);
    await gameModule.mount(container, services);
    mounted = { module: gameModule, container };
    return true;
  } catch (err) {
    console.error(`[shell] Failed to mount game "${entry.id}":`, err);
    viewport.innerHTML = '';
    return false;
  }
}

export async function unmountCurrentGame(): Promise<void> {
  if (!mounted) return;

  try {
    await mounted.module.unmount();
  } catch (err) {
    console.error('[shell] Error during game unmount:', err);
  }

  mounted.container.remove();
  mounted = null;
}

export function pauseCurrentGame(): void {
  if (mounted?.module.pause) {
    try {
      mounted.module.pause();
    } catch (err) {
      console.error('[shell] Error during game pause:', err);
    }
  }
}

export function resumeCurrentGame(): void {
  if (mounted?.module.resume) {
    try {
      mounted.module.resume();
    } catch (err) {
      console.error('[shell] Error during game resume:', err);
    }
  }
}

export function isMounted(): boolean {
  return mounted !== null;
}
