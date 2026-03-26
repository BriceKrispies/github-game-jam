import { createShellLayout } from './layout';
import { initRouter, onRouteChange, getCurrentRoute, navigate, type Route } from './router';
import { findGame } from './registry';
import { mountGame, unmountCurrentGame } from './lifecycle';
import { pauseCurrentGame, resumeCurrentGame } from './lifecycle';
import {
  renderHomeView,
  renderLibraryView,
  renderPlayView,
  renderAboutView,
  renderEmptyPlayState,
  renderUnavailableState,
  renderErrorState,
} from './views';

export function createApp(rootElement: HTMLElement): void {
  initRouter();

  const { main, updateActiveNav } = createShellLayout(rootElement);

  let currentGameId: string | null = null;

  async function handleRoute(route: Route): Promise<void> {
    await unmountCurrentGame();
    currentGameId = null;

    main.innerHTML = '';
    updateActiveNav(route.view);

    switch (route.view) {
      case 'home':
        main.appendChild(renderHomeView());
        break;

      case 'library':
        main.appendChild(renderLibraryView());
        break;

      case 'play':
        main.appendChild(renderPlayView(route.gameId));
        await handlePlayView(route.gameId);
        break;

      case 'about':
        main.appendChild(renderAboutView());
        break;
    }
  }

  async function handlePlayView(gameId?: string): Promise<void> {
    const viewport = document.getElementById('game-viewport');
    if (!viewport) return;

    if (!gameId) {
      viewport.appendChild(renderEmptyPlayState());
      return;
    }

    const entry = findGame(gameId);
    if (!entry) {
      viewport.appendChild(renderErrorState(gameId));
      return;
    }

    if (entry.status !== 'playable') {
      viewport.appendChild(renderUnavailableState(entry));
      return;
    }

    const success = await mountGame(entry, viewport);
    if (success) {
      currentGameId = gameId;
    } else {
      viewport.innerHTML = '';
      viewport.appendChild(renderErrorState(entry.name));
    }
  }

  onRouteChange(handleRoute);

  document.addEventListener('visibilitychange', () => {
    if (!currentGameId) return;
    if (document.hidden) {
      pauseCurrentGame();
    } else {
      resumeCurrentGame();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentGameId) {
      e.preventDefault();
      navigate('library');
    }
  });

  handleRoute(getCurrentRoute());
}
