import { STARTING_ENERGY, COLORS } from './config';
import type { GameState } from './types';

export function createHud(container: HTMLElement) {
  const hud = document.createElement('div');
  hud.className = 'courier-hud';

  hud.innerHTML = `
    <div class="hud-pill hud-score-pill">
      <span class="hud-pill-value" data-hud="score">0</span>
      <span class="hud-pill-label">pts</span>
    </div>
    <div class="hud-objective" data-hud="objective">
      <span class="hud-obj-text" data-hud="obj-text">Find a package</span>
    </div>
    <div class="hud-pill hud-energy-pill">
      <div class="hud-energy-track">
        <div class="hud-energy-bar" data-hud="energy-bar"></div>
      </div>
      <span class="hud-pill-value hud-energy-value" data-hud="energy-text">${STARTING_ENERGY}</span>
    </div>
    <div class="hud-combo-badge" data-hud="combo-wrap">
      <span data-hud="combo">x2</span>
    </div>
  `;

  container.appendChild(hud);

  const scoreEl = hud.querySelector('[data-hud="score"]') as HTMLElement;
  const objText = hud.querySelector('[data-hud="obj-text"]') as HTMLElement;
  const energyBar = hud.querySelector('[data-hud="energy-bar"]') as HTMLElement;
  const energyText = hud.querySelector('[data-hud="energy-text"]') as HTMLElement;
  const comboWrap = hud.querySelector('[data-hud="combo-wrap"]') as HTMLElement;
  const comboEl = hud.querySelector('[data-hud="combo"]') as HTMLElement;

  function update(state: GameState): void {
    scoreEl.textContent = String(state.score);

    // Objective text
    if (state.gameOver) {
      objText.textContent = '';
    } else if (state.player.carryingPackage) {
      objText.textContent = 'Deliver package!';
      objText.style.color = COLORS.delivery;
    } else if (state.packages.some(p => !p.pickedUp)) {
      objText.textContent = 'Pick up package';
      objText.style.color = COLORS.pickup;
    } else {
      objText.textContent = 'Waiting...';
      objText.style.color = COLORS.textSecondary;
    }

    // Energy
    const pct = (state.player.energy / STARTING_ENERGY) * 100;
    energyBar.style.width = `${pct}%`;
    energyBar.style.backgroundColor = pct < 25 ? COLORS.energyLow : COLORS.energy;
    energyText.textContent = String(Math.ceil(state.player.energy));

    // Combo
    if (state.combo > 1) {
      comboWrap.classList.add('visible');
      comboEl.textContent = `x${state.combo}`;
    } else {
      comboWrap.classList.remove('visible');
    }
  }

  return {
    update,
    destroy() { hud.remove(); },
  };
}
