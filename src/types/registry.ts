import type { GameModule } from './game';

export type GameStatus = 'playable' | 'coming-soon' | 'experimental';

export interface RegistryEntry {
  id: string;
  name: string;
  summary: string;
  tags: string[];
  status: GameStatus;
  version: string;
  load: () => Promise<{ default: GameModule }>;
}
