import type { State } from './types';

export function createHud(container: HTMLElement) {
  const hud = document.createElement('div');
  hud.className = 'tp-hud';

  hud.innerHTML = `
    <div class="tp-hud-pill">
      <span class="tp-hud-val" data-tp="score">0</span>
      <span class="tp-hud-lbl">pts</span>
    </div>
    <div class="tp-hud-pill tp-hud-round">
      <span class="tp-hud-lbl">R</span>
      <span class="tp-hud-val" data-tp="round">1</span>
    </div>
    <div class="tp-hud-pill tp-hud-lives" data-tp="lives-wrap">
    </div>
  `;

  container.appendChild(hud);

  const scoreEl = hud.querySelector('[data-tp="score"]') as HTMLElement;
  const roundEl = hud.querySelector('[data-tp="round"]') as HTMLElement;
  const livesWrap = hud.querySelector('[data-tp="lives-wrap"]') as HTMLElement;

  function update(state: State): void {
    scoreEl.textContent = String(state.score);
    roundEl.textContent = String(state.round);

    // Render lives as dots
    let html = '';
    for (let i = 0; i < state.lives; i++) {
      html += '<span class="tp-life-dot"></span>';
    }
    livesWrap.innerHTML = html;
  }

  return {
    update,
    destroy() { hud.remove(); },
  };
}
