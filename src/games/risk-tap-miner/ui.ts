import { COLORS } from './config';
import type { GameState } from './types';

export function createUI(container: HTMLElement, onCashOut: () => void) {
  // HUD overlay — score + banked
  const hud = document.createElement('div');
  hud.className = 'rtm-hud';
  hud.innerHTML = `
    <div class="rtm-hud-row">
      <div class="rtm-stat">
        <span class="rtm-stat-value" data-rtm="run-score">0</span>
        <span class="rtm-stat-label">run</span>
      </div>
      <div class="rtm-stat rtm-stat-banked">
        <span class="rtm-stat-value" data-rtm="banked">0</span>
        <span class="rtm-stat-label">banked</span>
      </div>
    </div>
    <div class="rtm-risk-bar">
      <div class="rtm-risk-fill" data-rtm="risk-fill"></div>
    </div>
  `;
  container.appendChild(hud);

  // Cash out button — bottom
  const cashBtn = document.createElement('button');
  cashBtn.className = 'rtm-cashout-btn';
  cashBtn.textContent = 'CASH OUT';
  cashBtn.type = 'button';
  cashBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCashOut();
  });
  container.appendChild(cashBtn);

  const runScoreEl = hud.querySelector('[data-rtm="run-score"]') as HTMLElement;
  const bankedEl = hud.querySelector('[data-rtm="banked"]') as HTMLElement;
  const riskFill = hud.querySelector('[data-rtm="risk-fill"]') as HTMLElement;

  function update(state: GameState): void {
    runScoreEl.textContent = String(state.runScore);
    bankedEl.textContent = String(state.bankedScore);

    // Risk bar
    const riskPct = Math.min(state.hazardChance * 100, 100);
    riskFill.style.width = `${riskPct}%`;

    if (riskPct > 60) {
      riskFill.style.backgroundColor = COLORS.hazard;
    } else if (riskPct > 30) {
      riskFill.style.backgroundColor = COLORS.depthMeterDanger;
    } else {
      riskFill.style.backgroundColor = COLORS.depthMeterFill;
    }

    // Run score color
    if (state.runScore > 0) {
      runScoreEl.style.color = COLORS.scoreGain;
    } else {
      runScoreEl.style.color = COLORS.text;
    }

    // Cash out button visibility
    if (state.phase === 'mining' && state.depth > 0) {
      cashBtn.style.opacity = '1';
      cashBtn.style.pointerEvents = 'auto';
    } else {
      cashBtn.style.opacity = '0.3';
      cashBtn.style.pointerEvents = 'none';
    }
  }

  return {
    update,
    destroy() {
      hud.remove();
      cashBtn.remove();
    },
  };
}
