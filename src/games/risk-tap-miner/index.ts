import type { GameModule, SharedServices } from '../../types/game';
import { createRenderer } from './renderer';
import { createInitialState, tap, cashOut, update } from './state';
import { createUI } from './ui';
import type { GameState } from './types';
import './risk-tap-miner.css';

let cleanup: (() => void) | null = null;

const game: GameModule = {
  id: 'risk-tap-miner',
  name: 'Risk Tap Miner',
  description: 'Push your luck. Tap to mine deeper. Cash out before it collapses.',

  mount(container: HTMLElement, services: SharedServices) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Risk Tap Miner — tap to mine, cash out to bank score');
    container.appendChild(canvas);

    const renderer = createRenderer(canvas);
    let state: GameState = createInitialState();

    // Load best scores from storage
    const savedBanked = services.storage.get<number>('bankedScore');
    const savedBest = services.storage.get<number>('bestRun');
    if (savedBanked) state.bankedScore = savedBanked;
    if (savedBest) state.bestRun = savedBest;

    function handleCashOut(): void {
      const prevBanked = state.bankedScore;
      cashOut(state);
      if (state.bankedScore > prevBanked) {
        services.storage.set('bankedScore', state.bankedScore);
        if (state.bestRun > (savedBest ?? 0)) {
          services.storage.set('bestRun', state.bestRun);
        }
      }
    }

    const ui = createUI(container, handleCashOut);

    // Tap handler — mine on click/tap anywhere on canvas
    function handlePointer(e: PointerEvent): void {
      // Don't capture clicks on UI elements
      const target = e.target as HTMLElement;
      if (target.closest('.rtm-cashout-btn') || target.closest('.rtm-hud')) return;

      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (state.phase === 'failed' || state.phase === 'cashed') {
        // Tapping during result phase — skip wait
        if (state.phaseTimer > 0) {
          state.phaseTimer = 0;
          // resetRun happens in update when timer hits 0
        }
        return;
      }

      tap(state, x, y);

      // Save best run on fail (tap mutates phase)
      if ((state.phase as string) === 'failed') {
        services.storage.set('bestRun', state.bestRun);
      }
    }

    container.addEventListener('pointerdown', handlePointer);
    canvas.style.touchAction = 'none';

    // Keyboard
    function handleKey(e: KeyboardEvent): void {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();

        if (state.phase !== 'mining') {
          if (state.phaseTimer > 0) state.phaseTimer = 0;
          return;
        }

        if (e.key === 'Enter') {
          handleCashOut();
        } else {
          // Space = mine (use center of canvas)
          const rect = canvas.getBoundingClientRect();
          tap(state, rect.width / 2, rect.height * 0.4);
          if ((state.phase as string) === 'failed') {
            services.storage.set('bestRun', state.bestRun);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKey);

    function resize(): void {
      renderer.resize(container.clientWidth, container.clientHeight);
    }

    resize();
    const unsubResize = services.viewport.onResize(() => resize());

    let running = true;
    let lastTime = performance.now();
    let elapsed = 0;
    let animationId: number | null = null;

    function frame(now: number): void {
      if (!running) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt * 1000;

      update(state, dt);
      renderer.draw(state, elapsed);
      ui.update(state);

      animationId = requestAnimationFrame(frame);
    }

    animationId = requestAnimationFrame(frame);

    cleanup = () => {
      running = false;
      if (animationId !== null) cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('keydown', handleKey);
      ui.destroy();
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
