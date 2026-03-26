import type { RegistryEntry } from '../types/registry';
import { getRegistry, getPlayableGames } from './registry';
import { navigate } from './router';

export function renderHomeView(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view-home';

  const playable = getPlayableGames();
  const total = getRegistry().length;

  section.innerHTML = `
    <div class="home-hero">
      <h1 class="home-hero-title">Game Studio</h1>
      <p class="home-hero-subtitle">
        A browser-based platform for self-contained games.
        Built with vanilla TypeScript, modern CSS, and Canvas 2D.
      </p>
      <button class="home-cta" data-action="browse">
        Browse Library
        <span aria-hidden="true">&rarr;</span>
      </button>
    </div>
    <div class="home-stats">
      <div class="home-stat-card">
        <div class="home-stat-value">${total}</div>
        <div class="home-stat-label">Total Games</div>
      </div>
      <div class="home-stat-card">
        <div class="home-stat-value">${playable.length}</div>
        <div class="home-stat-label">Playable Now</div>
      </div>
      <div class="home-stat-card">
        <div class="home-stat-value">${total - playable.length}</div>
        <div class="home-stat-label">In Development</div>
      </div>
    </div>
  `;

  section.querySelector('[data-action="browse"]')!
    .addEventListener('click', () => navigate('library'));

  return section;
}

export function renderLibraryView(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view-library';

  const entries = getRegistry();

  section.innerHTML = `
    <div class="library-header">
      <h1 class="library-title">Library</h1>
      <p class="library-subtitle">${entries.length} game${entries.length !== 1 ? 's' : ''} registered</p>
    </div>
    <div class="library-grid"></div>
  `;

  const grid = section.querySelector('.library-grid')!;
  entries.forEach(entry => grid.appendChild(createGameCard(entry)));

  return section;
}

function createGameCard(entry: RegistryEntry): HTMLElement {
  const card = document.createElement('article');
  card.className = 'game-card';

  const isPlayable = entry.status === 'playable';
  const statusLabel = entry.status === 'playable' ? 'Playable'
    : entry.status === 'coming-soon' ? 'Coming Soon'
    : 'Experimental';

  card.innerHTML = `
    <div class="game-card-header">
      <h2 class="game-card-title">${entry.name}</h2>
      <span class="game-card-version">v${entry.version}</span>
    </div>
    <p class="game-card-summary">${entry.summary}</p>
    <div class="game-card-tags">
      ${entry.tags.map(t => `<span class="game-card-tag">${t}</span>`).join('')}
    </div>
    <div class="game-card-footer">
      <span class="game-card-status" data-status="${entry.status}">
        <span class="game-card-status-dot"></span>
        ${statusLabel}
      </span>
      <button class="game-card-action" data-playable="${isPlayable}">
        ${isPlayable ? 'Play' : 'Coming Soon'}
      </button>
    </div>
  `;

  if (isPlayable) {
    card.querySelector('.game-card-action')!
      .addEventListener('click', () => navigate('play', entry.id));
  }

  return card;
}

export function renderPlayView(gameId?: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view-play';

  const toolbar = document.createElement('div');
  toolbar.className = 'play-toolbar';

  const backBtn = document.createElement('button');
  backBtn.className = 'play-back-btn';
  backBtn.innerHTML = `&larr; Library`;
  backBtn.addEventListener('click', () => navigate('library'));
  toolbar.appendChild(backBtn);

  if (gameId) {
    const title = document.createElement('span');
    title.className = 'play-game-title';
    const entry = getRegistry().find(e => e.id === gameId);
    title.textContent = entry?.name ?? gameId;
    toolbar.appendChild(title);
  }

  section.appendChild(toolbar);

  const viewport = document.createElement('div');
  viewport.className = 'game-viewport';
  viewport.id = 'game-viewport';
  section.appendChild(viewport);

  return section;
}

export function renderEmptyPlayState(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'game-empty-state';
  el.innerHTML = `
    <div class="game-empty-icon" aria-hidden="true">&#x1F3AE;</div>
    <h2 class="game-empty-title">No game selected</h2>
    <p class="game-empty-desc">Choose a game from the library to start playing.</p>
    <button class="game-empty-browse-btn" data-action="browse">Browse Library</button>
  `;
  el.querySelector('[data-action="browse"]')!
    .addEventListener('click', () => navigate('library'));
  return el;
}

export function renderUnavailableState(entry: RegistryEntry): HTMLElement {
  const el = document.createElement('div');
  el.className = 'game-unavailable-state';
  el.innerHTML = `
    <div class="game-unavailable-icon" aria-hidden="true">&#x1F6A7;</div>
    <h2 class="game-unavailable-title">${entry.name}</h2>
    <p class="game-unavailable-desc">This game is not playable yet. Check back later.</p>
  `;
  return el;
}

export function renderErrorState(name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'game-error-state';
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="game-error-icon" aria-hidden="true">&#x26A0;</div>
    <h2 class="game-error-title">Failed to load</h2>
    <p class="game-error-desc">Something went wrong while starting ${name}.</p>
    <button class="game-empty-browse-btn" data-action="browse">Back to Library</button>
  `;
  el.querySelector('[data-action="browse"]')!
    .addEventListener('click', () => navigate('library'));
  return el;
}

export function renderAboutView(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'view-about';

  section.innerHTML = `
    <div class="about-content">
      <h1 class="about-title">About Game Studio</h1>

      <div class="about-section">
        <h2 class="about-section-title">What is this?</h2>
        <p class="about-text">
          Game Studio is a lightweight browser platform for hosting multiple self-contained games.
          Each game is an isolated module that mounts into a shared runtime shell. The shell handles
          navigation, lifecycle orchestration, and shared services. Games handle everything else.
        </p>
      </div>

      <div class="about-section">
        <h2 class="about-section-title">Architecture</h2>
        <ul class="about-list">
          <li>The shell orchestrates &mdash; it never contains game logic</li>
          <li>Games are fully isolated from each other</li>
          <li>One game runs at a time with clean mount/unmount lifecycle</li>
          <li>Shared services (storage, viewport, audio) are injected, never global</li>
          <li>No frameworks &mdash; vanilla TypeScript, semantic HTML, modern CSS</li>
        </ul>
      </div>

      <div class="about-section">
        <h2 class="about-section-title">Tech Stack</h2>
        <div class="about-tech-grid">
          <div class="about-tech-item">
            <div class="about-tech-name">TypeScript</div>
            <div class="about-tech-desc">Strict mode, ES2022 target</div>
          </div>
          <div class="about-tech-item">
            <div class="about-tech-name">Vite</div>
            <div class="about-tech-desc">Build tooling and dev server</div>
          </div>
          <div class="about-tech-item">
            <div class="about-tech-name">Canvas 2D</div>
            <div class="about-tech-desc">Baseline game renderer</div>
          </div>
          <div class="about-tech-item">
            <div class="about-tech-name">GitHub Pages</div>
            <div class="about-tech-desc">Static deployment target</div>
          </div>
        </div>
      </div>

      <div class="about-section">
        <h2 class="about-section-title">Design Goals</h2>
        <ul class="about-list">
          <li>Strict boundaries between shell, engine, and games</li>
          <li>AI-agent-friendly structure for future game development</li>
          <li>Desktop and mobile support with responsive layouts</li>
          <li>Minimal dependencies &mdash; keep the platform light</li>
        </ul>
      </div>
    </div>
  `;

  return section;
}
