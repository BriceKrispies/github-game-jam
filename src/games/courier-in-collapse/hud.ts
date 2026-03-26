import { STARTING_ENERGY, COLORS } from './config';
import type { GameState } from './types';

export function createHud(container: HTMLElement) {
  const hud = document.createElement('div');
  hud.className = 'courier-hud';

  hud.innerHTML = `
    <div class="hud-left">
      <div class="hud-score">
        <span class="hud-label">SCORE</span>
        <span class="hud-value" data-hud="score">0</span>
      </div>
      <div class="hud-deliveries">
        <span class="hud-label">DELIVERIES</span>
        <span class="hud-value" data-hud="deliveries">0</span>
      </div>
    </div>
    <div class="hud-right">
      <div class="hud-combo" data-hud="combo-wrap" style="display:none">
        <span class="hud-combo-value" data-hud="combo">x1</span>
      </div>
      <div class="hud-energy-bar">
        <div class="hud-energy-fill" data-hud="energy-fill"></div>
        <span class="hud-energy-text" data-hud="energy-text">${STARTING_ENERGY}</span>
      </div>
    </div>
  `;

  container.appendChild(hud);

  const scoreEl = hud.querySelector('[data-hud="score"]') as HTMLElement;
  const deliveriesEl = hud.querySelector('[data-hud="deliveries"]') as HTMLElement;
  const comboWrap = hud.querySelector('[data-hud="combo-wrap"]') as HTMLElement;
  const comboEl = hud.querySelector('[data-hud="combo"]') as HTMLElement;
  const energyFill = hud.querySelector('[data-hud="energy-fill"]') as HTMLElement;
  const energyText = hud.querySelector('[data-hud="energy-text"]') as HTMLElement;

  function update(state: GameState): void {
    scoreEl.textContent = String(state.score);
    deliveriesEl.textContent = String(state.deliveries);

    if (state.combo > 1) {
      comboWrap.style.display = '';
      comboEl.textContent = `x${state.combo}`;
    } else {
      comboWrap.style.display = 'none';
    }

    const pct = (state.player.energy / STARTING_ENERGY) * 100;
    energyFill.style.width = `${pct}%`;
    energyFill.style.backgroundColor = pct < 25 ? COLORS.energyLow : COLORS.energy;
    energyText.textContent = String(Math.ceil(state.player.energy));
  }

  return {
    update,
    destroy() { hud.remove(); },
  };
}
