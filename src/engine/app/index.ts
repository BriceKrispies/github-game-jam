import type {
  EngineHost,
  EngineContext,
  GameDefinition,
  RenderSurface,
  SceneManager,
} from '../contracts';
import { createClock } from '../time';
import { createRenderSurface } from '../render';
import { createInputManager } from '../input';
import { createSceneManager } from '../scenes';
import { createAssetManager } from '../assets';
import { createAudioManager } from '../audio';

/**
 * Create an engine host instance.
 * The shell creates one of these and calls start/stop as games are mounted/unmounted.
 */
export function createEngineHost(): EngineHost {
  let running = false;
  let animationId: number | null = null;

  // Active subsystem references (set during start, cleared during stop)
  let surface: ReturnType<typeof createRenderSurface> | null = null;
  let input: ReturnType<typeof createInputManager> | null = null;
  let sceneManager: ReturnType<typeof createSceneManager> | null = null;
  let assets: ReturnType<typeof createAssetManager> | null = null;
  let audio: ReturnType<typeof createAudioManager> | null = null;
  let clock: ReturnType<typeof createClock> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let ctx: EngineContext | null = null;
  let gameDef: GameDefinition | null = null;
  let paused = false;

  async function start(container: HTMLElement, game: GameDefinition): Promise<void> {
    if (running) {
      await stop();
    }

    gameDef = game;

    // Create subsystems
    clock = createClock();
    surface = createRenderSurface(container);
    input = createInputManager(surface.canvas);
    assets = createAssetManager();
    audio = createAudioManager();

    // Build context (circular ref: sceneManager needs ctx, ctx needs sceneManager)
    // We use a lazy getter pattern
    const contextShell: Partial<EngineContext> = {
      input,
      assets,
      audio,
      surface,
      container,
    };

    // Create scene manager
    sceneManager = createSceneManager(game.scenes, () => ctx!);

    // Finalize context
    ctx = {
      ...contextShell,
      time: clock.info,
      scenes: sceneManager as SceneManager,
    } as EngineContext;

    // Observe resizes
    resizeObserver = new ResizeObserver(() => {
      if (!surface || !sceneManager) return;
      surface.resize();
      sceneManager.resize(surface.width, surface.height);
    });
    resizeObserver.observe(container);

    // Init game
    if (game.init) {
      await game.init(ctx);
    }

    // Enter first scene
    const sceneNames = Object.keys(game.scenes);
    if (sceneNames.length > 0) {
      sceneManager.switchTo(sceneNames[0]);
    }

    // Start loop
    running = true;
    paused = false;
    animationId = requestAnimationFrame(frame);
  }

  function frame(now: number): void {
    if (!running) return;

    if (paused) {
      clock!.reset(now);
      animationId = requestAnimationFrame(frame);
      return;
    }

    const dt = clock!.tick(now);

    // Update input state for this frame
    input!.update();

    // Update context time reference (clock.info is live)
    // Scene update + render
    sceneManager!.update(dt);
    sceneManager!.render(surface!);

    animationId = requestAnimationFrame(frame);
  }

  async function stop(): Promise<void> {
    running = false;

    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (gameDef?.dispose && ctx) {
      try {
        gameDef.dispose(ctx);
      } catch (err) {
        console.error('[engine] Error during game dispose:', err);
      }
    }

    sceneManager?.dispose();
    input?.destroy();
    audio?.dispose();
    assets?.clear();
    surface?.destroy();
    resizeObserver?.disconnect();

    surface = null;
    input = null;
    sceneManager = null;
    assets = null;
    audio = null;
    clock = null;
    resizeObserver = null;
    ctx = null;
    gameDef = null;
    paused = false;
  }

  function pause(): void {
    if (!running) return;
    paused = true;
    if (gameDef?.pause && ctx) {
      try { gameDef.pause(ctx); } catch (err) { console.error('[engine] Error during pause:', err); }
    }
  }

  function resume(): void {
    if (!running) return;
    paused = false;
    if (gameDef?.resume && ctx) {
      try { gameDef.resume(ctx); } catch (err) { console.error('[engine] Error during resume:', err); }
    }
  }

  return {
    start,
    stop,
    pause,
    resume,
    get running() { return running; },
  };
}
