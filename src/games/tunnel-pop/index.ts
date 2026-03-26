import type { GameModule, SharedServices } from '../../types/game';
import { createRenderer } from './renderer';
import { createState, setDirection, tryAttack, update, restartGame } from './state';
import { createInput } from './input';
import { createHud } from './hud';
import type { State } from './types';
import './tunnel-pop.css';

let cleanup: (() => void) | null = null;

const game: GameModule = {
  id: 'tunnel-pop',
  name: 'Tunnel Pop',
  description: 'Carve tunnels, corner enemies, and survive the underground swarm.',

  mount(container: HTMLElement, services: SharedServices) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Tunnel Pop — arrow keys or WASD to move, space to attack');
    container.appendChild(canvas);

    const renderer = createRenderer(canvas);
    const hud = createHud(container);
    let state: State = createState();

    // Load high score
    const savedHigh = services.storage.get<number>('highScore') ?? 0;

    function resize(): void {
      renderer.resize(container.clientWidth, container.clientHeight);
    }

    resize();
    const unsubResize = services.viewport.onResize(() => resize());

    const destroyInput = createInput(
      container,
      (dir) => setDirection(state, dir),
      () => tryAttack(state),
      () => {
        if (state.phase === 'gameOver') {
          // Save high score
          if (state.score > savedHigh) {
            services.storage.set('highScore', state.score);
          }
          restartGame(state);
        }
      },
      () => state.phase === 'gameOver',
    );

    // Tap to restart on game over (canvas)
    function handlePointer(e: PointerEvent): void {
      if (state.phase === 'gameOver') {
        e.preventDefault();
        if (state.score > savedHigh) {
          services.storage.set('highScore', state.score);
        }
        restartGame(state);
      }
    }
    container.addEventListener('pointerdown', handlePointer);

    let running = true;
    let lastTime = performance.now();
    let animationId: number | null = null;

    function frame(now: number): void {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      update(state, dt);
      renderer.draw(state);
      hud.update(state);

      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    cleanup = () => {
      running = false;
      if (animationId !== null) cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', handlePointer);
      destroyInput();
      hud.destroy();
      unsubResize();
    };
  },

  unmount() {
    if (cleanup) { cleanup(); cleanup = null; }
  },

  pause() {},
  resume() {},
};

export default game;
