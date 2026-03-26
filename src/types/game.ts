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

export interface GameModule {
  id: string;
  name: string;
  description: string;
  mount(container: HTMLElement, services: SharedServices): void | Promise<void>;
  unmount(): void | Promise<void>;
  pause?(): void;
  resume?(): void;
}
