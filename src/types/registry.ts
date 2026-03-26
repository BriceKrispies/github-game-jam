import type { GameDefinition } from '../engine';

export type GameStatus = 'playable' | 'coming-soon' | 'experimental';

export interface RegistryEntry {
  id: string;
  name: string;
  summary: string;
  tags: string[];
  status: GameStatus;
  version: string;
  /** Dynamic import returning an engine GameDefinition. */
  load: () => Promise<{ default: GameDefinition }>;
}
