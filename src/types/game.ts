// Shell-level service interfaces.
// These are provided by the shell to games for persistence and viewport info.
// The engine provides its own runtime context (EngineContext) separately.

export interface GameStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  keys(): string[];
  clear(): void;
}

export interface ViewportService {
  readonly width: number;
  readonly height: number;
  onResize(callback: (width: number, height: number) => void): () => void;
}

export interface AudioService {
  readonly context: AudioContext;
}

export interface SharedServices {
  storage: GameStorage;
  viewport: ViewportService;
  audio: AudioService;
}

/**
 * Legacy GameModule interface — kept for backward compatibility during migration.
 * New games should use GameDefinition from the engine instead.
 */
export interface GameModule {
  id: string;
  name: string;
  description: string;
  mount(container: HTMLElement, services: SharedServices): void | Promise<void>;
  unmount(): void | Promise<void>;
  pause?(): void;
  resume?(): void;
}
