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
    id: 'courier-in-collapse',
    name: 'Courier in Collapse',
    summary: 'Deliver packages across a collapsing grid world. Race against time as the ground crumbles beneath your feet.',
    tags: ['action', 'puzzle', 'canvas', 'grid'],
    status: 'playable',
    version: '1.0.0',
    load: () => import('../games/courier-in-collapse/index'),
  },
  {
    id: 'risk-tap-miner',
    name: 'Risk Tap Miner',
    summary: 'Push your luck. Go deeper. Cash out before it collapses.',
    tags: ['arcade', 'risk', 'tap', 'high-score'],
    status: 'playable',
    version: '1.0.0',
    load: () => import('../games/risk-tap-miner/index'),
  },
  {
    id: 'tunnel-pop',
    name: 'Tunnel Pop',
    summary: 'Carve tunnels, corner enemies, and survive the underground swarm.',
    tags: ['arcade', 'digging', 'action', 'retro-inspired'],
    status: 'playable',
    version: '0.1.0',
    load: () => import('../games/tunnel-pop/index'),
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
