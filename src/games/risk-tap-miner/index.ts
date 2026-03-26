import type { GameDefinition, Scene, EngineContext, RenderSurface } from '../../engine';
import { createRenderer } from './renderer';
import { createInitialState, tap, cashOut, update } from './state';
import { createUI } from './ui';
import type { GameState } from './types';
import './risk-tap-miner.css';

function createGameScene(): Scene & { _cleanup?(): void } {
  let state: GameState;
  let renderer: ReturnType<typeof createRenderer>;
  let ui: ReturnType<typeof createUI>;
  let elapsed = 0;

  return {
    enter(ctx: EngineContext) {
      const { canvas } = ctx.surface;
      canvas.setAttribute('aria-label', 'Risk Tap Miner — tap to mine, cash out to bank score');

      renderer = createRenderer(canvas);
      state = createInitialState();

      // Cash out handler
      function handleCashOut(): void {
        cashOut(state);
      }

      ui = createUI(ctx.container, handleCashOut);
      elapsed = 0;

      // Initial resize
      renderer.resize(ctx.surface.width, ctx.surface.height);
    },

    update(ctx: EngineContext, dt: number) {
      const { input } = ctx;
      elapsed += dt * 1000;

      // Pointer input: mine on click/tap
      if (input.pointer.justPressed) {
        if (state.phase === 'failed' || state.phase === 'cashed') {
          if (state.phaseTimer > 0) {
            state.phaseTimer = 0;
          }
        } else {
          tap(state, input.pointer.x, input.pointer.y);
        }
      }

      // Keyboard: Space=mine, Enter=cash out
      if (input.isKeyJustPressed(' ')) {
        if (state.phase !== 'mining') {
          if (state.phaseTimer > 0) state.phaseTimer = 0;
        } else {
          const { width, height } = ctx.surface;
          tap(state, width / 2, height * 0.4);
        }
      }

      if (input.isKeyJustPressed('Enter')) {
        if (state.phase === 'mining') {
          cashOut(state);
        } else if (state.phaseTimer > 0) {
          state.phaseTimer = 0;
        }
      }

      update(state, dt);
      ui.update(state);
    },

    render(_ctx: EngineContext, _surface: RenderSurface) {
      renderer.draw(state, elapsed);
    },

    resize(ctx: EngineContext, width: number, height: number) {
      renderer.resize(width, height);
    },

    exit() {
      ui?.destroy();
    },

    _cleanup() {
      ui?.destroy();
    },
  };
}

const game: GameDefinition = {
  id: 'risk-tap-miner',
  scenes: { main: createGameScene() },
};

export default game;
