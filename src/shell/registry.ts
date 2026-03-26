import type { RegistryEntry } from '../types/registry';

const registry: RegistryEntry[] = [
  {
    id: 'bounce-demo',
    name: 'Bounce',
    summary: 'A bouncing ball demo that reacts to clicks and taps. Demonstrates the shell mount lifecycle with a real animation loop.',
    tags: ['demo', 'canvas', 'interactive'],
    status: 'playable',
    version: '0.1.0',
    load: () => import('../games/bounce-demo/index'),
  },
  {
    id: 'coming-soon-demo',
    name: 'Untitled Puzzle Game',
    summary: 'A puzzle game concept currently in early design. Not yet playable.',
    tags: ['puzzle', 'planned'],
    status: 'coming-soon',
    version: '0.0.0',
    load: () => import('../games/coming-soon-demo/index'),
  },
];

export function getRegistry(): ReadonlyArray<RegistryEntry> {
  return registry;
}

export function findGame(id: string): RegistryEntry | undefined {
  return registry.find(entry => entry.id === id);
}

export function getPlayableGames(): ReadonlyArray<RegistryEntry> {
  return registry.filter(entry => entry.status === 'playable');
}
