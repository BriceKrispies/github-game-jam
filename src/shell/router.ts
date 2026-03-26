export type ShellView = 'home' | 'library' | 'play' | 'about';

export interface Route {
  view: ShellView;
  gameId?: string;
}

type RouteChangeCallback = (route: Route) => void;

const listeners = new Set<RouteChangeCallback>();

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');

  if (!raw || raw === 'home') return { view: 'home' };
  if (raw === 'library') return { view: 'library' };
  if (raw === 'about') return { view: 'about' };

  if (raw.startsWith('play/')) {
    const gameId = raw.slice(5);
    if (gameId) return { view: 'play', gameId };
    return { view: 'play' };
  }

  if (raw === 'play') return { view: 'play' };

  return { view: 'home' };
}

export function getCurrentRoute(): Route {
  return parseHash(location.hash);
}

export function navigate(view: ShellView, gameId?: string): void {
  let hash: string;

  if (view === 'home') hash = '#home';
  else if (view === 'play' && gameId) hash = `#play/${gameId}`;
  else hash = `#${view}`;

  if (location.hash === hash) {
    notifyListeners(parseHash(hash));
    return;
  }

  location.hash = hash;
}

export function onRouteChange(callback: RouteChangeCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(route: Route): void {
  listeners.forEach(cb => cb(route));
}

export function initRouter(): void {
  window.addEventListener('hashchange', () => {
    notifyListeners(getCurrentRoute());
  });
}
