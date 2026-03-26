import type { RegistryEntry } from '../types/registry';

const registry: RegistryEntry[] = [
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
    id: 'tunnel-pop',
    name: 'Tunnel Pop',
    summary: 'Carve tunnels, corner enemies, and survive the underground swarm.',
    tags: ['arcade', 'digging', 'action', 'retro-inspired'],
    status: 'playable',
    version: '0.1.0',
    load: () => import('../games/tunnel-pop/index'),
  }
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
