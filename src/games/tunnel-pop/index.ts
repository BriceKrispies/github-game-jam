import type { GameDefinition, Scene, EngineContext, RenderSurface } from '../../engine';
import { createRenderer } from './renderer';
import { createState, setDirection, tryAttack, update, restartGame } from './state';
import { createInput } from './input';
import { createHud } from './hud';
import type { State } from './types';
import './tunnel-pop.css';

function createGameScene(): Scene {
  let state: State;
  let renderer: ReturnType<typeof createRenderer>;
  let hud: ReturnType<typeof createHud>;
  let destroyInput: (() => void) | null = null;

  return {
    enter(ctx: EngineContext) {
      const { canvas } = ctx.surface;
      canvas.setAttribute('aria-label', 'Tunnel Pop — arrow keys or WASD to move, space to attack');

      renderer = createRenderer(canvas);
      hud = createHud(ctx.container);
      state = createState();

      destroyInput = createInput(
        ctx.container,
        (dir) => setDirection(state, dir),
        () => tryAttack(state),
        () => {
          if (state.phase === 'gameOver') {
            restartGame(state);
          }
        },
        () => state.phase === 'gameOver',
      );

      // Tap to restart on game over
      function handlePointer(e: PointerEvent): void {
        if (state.phase === 'gameOver') {
          e.preventDefault();
          restartGame(state);
        }
      }
      ctx.container.addEventListener('pointerdown', handlePointer);

      // Store cleanup for the extra listener
      const origDestroy = destroyInput;
      destroyInput = () => {
        origDestroy();
        ctx.container.removeEventListener('pointerdown', handlePointer);
      };

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
  id: 'tunnel-pop',
  scenes: { main: createGameScene() },
};

export default game;
