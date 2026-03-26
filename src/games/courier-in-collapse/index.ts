import type { GameDefinition, Scene, EngineContext, RenderSurface } from '../../engine';
import { createRenderer } from './renderer';
import { createInitialState, tryMove, update } from './state';
import { createInputHandler } from './input';
import { createHud } from './hud';
import type { GameState } from './types';
import './courier.css';

function createGameScene(): Scene {
  let state: GameState;
  let renderer: ReturnType<typeof createRenderer>;
  let hud: ReturnType<typeof createHud>;
  let destroyInput: (() => void) | null = null;

  return {
    enter(ctx: EngineContext) {
      const { canvas } = ctx.surface;
      canvas.setAttribute('aria-label', 'Courier in Collapse — use arrow keys or WASD to move');

      renderer = createRenderer(canvas);
      hud = createHud(ctx.container);
      state = createInitialState();

      function resetGame(): void {
        state = createInitialState();
      }

      destroyInput = createInputHandler(
        ctx.container,
        (dir) => { tryMove(state, dir); },
        () => { if (state.gameOver) resetGame(); },
        () => state.gameOver,
      );

      renderer.resize(ctx.surface.width, ctx.surface.height);
    },

    update(_ctx: EngineContext, dt: number) {
      update(state, dt);
      hud.update(state);
    },

    render(_ctx: EngineContext, _surface: RenderSurface) {
      renderer.draw(state);
    },

    resize(_ctx: EngineContext, width: number, height: number) {
      renderer.resize(width, height);
    },

    exit() {
      destroyInput?.();
      hud?.destroy();
    },
  };
}

const game: GameDefinition = {
  id: 'courier-in-collapse',
  scenes: { main: createGameScene() },
};

export default game;
