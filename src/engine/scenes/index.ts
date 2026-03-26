import type { Scene, SceneManager, EngineContext, RenderSurface } from '../contracts';

export function createSceneManager(
  scenes: Record<string, Scene>,
  getContext: () => EngineContext,
): SceneManager & {
  update(dt: number): void;
  render(surface: RenderSurface): void;
  resize(width: number, height: number): void;
  dispose(): void;
} {
  let currentName: string | null = null;
  let currentScene: Scene | null = null;

  function switchTo(name: string): void {
    const next = scenes[name];
    if (!next) {
      console.error(`[engine] Scene "${name}" not found`);
      return;
    }

    const ctx = getContext();

    if (currentScene?.exit) {
      currentScene.exit(ctx);
    }

    currentName = name;
    currentScene = next;

    if (currentScene.enter) {
      currentScene.enter(ctx);
    }
  }

  function update(dt: number): void {
    if (currentScene) {
      currentScene.update(getContext(), dt);
    }
  }

  function render(surface: RenderSurface): void {
    if (currentScene) {
      currentScene.render(getContext(), surface);
    }
  }

  function resize(width: number, height: number): void {
    if (currentScene?.resize) {
      currentScene.resize(getContext(), width, height);
    }
  }

  function dispose(): void {
    if (currentScene?.exit) {
      currentScene.exit(getContext());
    }
    currentScene = null;
    currentName = null;
  }

  return {
    switchTo,
    get currentName() { return currentName; },
    update,
    render,
    resize,
    dispose,
  };
}
