import type { GameModule, SharedServices } from '../../types/game';
import { createRenderer } from './renderer';
import { createInitialState, tryMove, update } from './state';
import { createInputHandler } from './input';
import { createHud } from './hud';
import type { GameState } from './types';
import './courier.css';

let cleanup: (() => void) | null = null;

const game: GameModule = {
  id: 'courier-in-collapse',
  name: 'Courier in Collapse',
  description: 'Deliver packages across a collapsing grid world. Pick up parcels from terminals and race to deliver them before the ground falls away beneath you.',

  mount(container: HTMLElement, services: SharedServices) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Courier in Collapse — use arrow keys or WASD to move');
    container.appendChild(canvas);

    const renderer = createRenderer(canvas);
    const hud = createHud(container);

    let state: GameState = createInitialState();
    let animationId: number | null = null;
    let running = true;
    let paused = false;

    function resetGame(): void {
      state = createInitialState();
    }

    function resize(): void {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.resize(w, h);
    }

    resize();
    const unsubResize = services.viewport.onResize(() => resize());

    const destroyInput = createInputHandler(
      container,
      (dir) => { tryMove(state, dir); },
      () => { if (state.gameOver) resetGame(); },
      () => state.gameOver,
    );

    // Save high score on game over
    let lastSavedScore = -1;

    function checkHighScore(): void {
      if (state.gameOver && state.score !== lastSavedScore) {
        lastSavedScore = state.score;
        const best = services.storage.get<number>('highScore') ?? 0;
        if (state.score > best) {
          services.storage.set('highScore', state.score);
        }
      }
    }

    let lastTime = performance.now();

    function frame(now: number): void {
      if (!running) return;
      if (paused) {
        lastTime = now;
        animationId = requestAnimationFrame(frame);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      update(state, dt);
      renderer.draw(state);
      hud.update(state);
      checkHighScore();

      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    cleanup = () => {
      running = false;
      if (animationId !== null) cancelAnimationFrame(animationId);
      destroyInput();
      hud.destroy();
      unsubResize();
    };
  },

  unmount() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  },

  pause() {
    // Handled by paused flag in frame loop
  },

  resume() {
    // rAF continues; paused flag cleared
  },
};

export default game;
