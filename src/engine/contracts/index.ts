/**
 * Engine contracts — the public API surface of the engine.
 *
 * Games implement GameDefinition + Scene.
 * The shell interacts with the engine through EngineHost.
 * The engine provides EngineContext to game code at runtime.
 */

// ── Render surface ──

export interface RenderSurface {
  /** The underlying canvas element (owned by the engine). */
  readonly canvas: HTMLCanvasElement;
  /** The 2D rendering context. */
  readonly ctx: CanvasRenderingContext2D;
  /** Logical width in CSS pixels. */
  readonly width: number;
  /** Logical height in CSS pixels. */
  readonly height: number;
  /** Device pixel ratio used for rendering. */
  readonly dpr: number;
}

// ── Input ──

export interface PointerState {
  /** Whether pointer is currently pressed. */
  readonly down: boolean;
  /** X in canvas logical coordinates. */
  readonly x: number;
  /** Y in canvas logical coordinates. */
  readonly y: number;
  /** Whether a press started this frame. */
  readonly justPressed: boolean;
  /** Whether a press ended this frame. */
  readonly justReleased: boolean;
}

export interface InputManager {
  /** Check if a key is currently held down. */
  isKeyDown(key: string): boolean;
  /** Check if a key was pressed this frame. */
  isKeyJustPressed(key: string): boolean;
  /** Check if a key was released this frame. */
  isKeyJustReleased(key: string): boolean;
  /** Current pointer/touch state. */
  readonly pointer: PointerState;
  /** Get all keys currently held down. */
  readonly keysDown: ReadonlySet<string>;
}

// ── Assets ──

export interface AssetManager {
  /** Load an image and cache it. Returns the loaded image. */
  loadImage(key: string, src: string): Promise<HTMLImageElement>;
  /** Get a previously loaded image (returns undefined if not loaded). */
  getImage(key: string): HTMLImageElement | undefined;
  /** Check if an image is loaded. */
  hasImage(key: string): boolean;
  /** Remove a cached asset. */
  unload(key: string): void;
  /** Remove all cached assets. */
  clear(): void;
}

// ── Audio ──

export interface AudioManager {
  /** Play a sound effect. Returns a stop function. */
  play(src: string, options?: { volume?: number; loop?: boolean }): { stop(): void };
  /** Stop all currently playing sounds. */
  stopAll(): void;
  /** Master volume (0..1). */
  volume: number;
  /** Dispose resources. */
  dispose(): void;
}

// ── Time ──

export interface TimeInfo {
  /** Seconds since last frame (clamped). */
  readonly delta: number;
  /** Total elapsed seconds since engine start. */
  readonly elapsed: number;
  /** Current frame number. */
  readonly frame: number;
}

// ── Scene ──

export interface Scene {
  /** Called when the scene becomes active. */
  enter?(ctx: EngineContext): void;
  /** Called every frame. */
  update(ctx: EngineContext, dt: number): void;
  /** Called every frame after update. */
  render(ctx: EngineContext, surface: RenderSurface): void;
  /** Called when the scene is deactivated. */
  exit?(ctx: EngineContext): void;
  /** Called when the viewport resizes. */
  resize?(ctx: EngineContext, width: number, height: number): void;
}

// ── Scene Manager ──

export interface SceneManager {
  /** Switch to a named scene. Calls exit on current, enter on next. */
  switchTo(name: string): void;
  /** The name of the currently active scene, or null. */
  readonly currentName: string | null;
}

// ── Engine Context ──

/** Provided to game scenes at runtime. This is the game's view of the engine. */
export interface EngineContext {
  readonly input: InputManager;
  readonly assets: AssetManager;
  readonly audio: AudioManager;
  readonly time: TimeInfo;
  readonly surface: RenderSurface;
  readonly scenes: SceneManager;
  /** The container DOM element the engine is mounted into. */
  readonly container: HTMLElement;
}

// ── Game Definition ──

/** What a game provides to the engine. */
export interface GameDefinition {
  /** Unique game identifier. */
  readonly id: string;
  /** Map of named scenes. The first entry is used as the initial scene. */
  readonly scenes: Record<string, Scene>;
  /** Optional: called once when the engine creates the game instance. */
  init?(ctx: EngineContext): void | Promise<void>;
  /** Optional: called when the game is disposed. */
  dispose?(ctx: EngineContext): void;
  /** Optional: called on pause (tab hidden). */
  pause?(ctx: EngineContext): void;
  /** Optional: called on resume (tab visible). */
  resume?(ctx: EngineContext): void;
}

// ── Engine Host ──

/** The shell's interface to control a running engine instance. */
export interface EngineHost {
  /** Start the engine with a game definition in the given container. */
  start(container: HTMLElement, game: GameDefinition): Promise<void>;
  /** Stop the engine and clean up. */
  stop(): Promise<void>;
  /** Pause the game loop. */
  pause(): void;
  /** Resume the game loop. */
  resume(): void;
  /** Whether the engine is currently running. */
  readonly running: boolean;
}
