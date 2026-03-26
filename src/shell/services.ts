import type { SharedServices, GameStorage, ViewportService } from '../types/game';

const STORAGE_PREFIX = 'studio';

function createGameStorage(gameId: string): GameStorage {
  const prefix = `${STORAGE_PREFIX}:${gameId}:`;

  return {
    get<T>(key: string): T | null {
      const raw = localStorage.getItem(prefix + key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    set<T>(key: string, value: T): void {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    },

    remove(key: string): void {
      localStorage.removeItem(prefix + key);
    },

    keys(): string[] {
      const result: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          result.push(k.slice(prefix.length));
        }
      }
      return result;
    },

    clear(): void {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach(k => localStorage.removeItem(k));
    },
  };
}

function createViewportService(container: HTMLElement): ViewportService {
  const callbacks = new Set<(w: number, h: number) => void>();
  let width = container.clientWidth;
  let height = container.clientHeight;

  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      callbacks.forEach(cb => cb(width, height));
    }
  });
  observer.observe(container);

  return {
    get width() { return width; },
    get height() { return height; },
    onResize(callback: (w: number, h: number) => void): () => void {
      callbacks.add(callback);
      return () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          observer.disconnect();
        }
      };
    },
  };
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function createSharedServices(gameId: string, container: HTMLElement): SharedServices {
  return {
    storage: createGameStorage(gameId),
    viewport: createViewportService(container),
    audio: { context: getAudioContext() },
  };
}
