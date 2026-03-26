import type { GameModule } from '../../types/game';

const game: GameModule = {
  id: 'coming-soon-demo',
  name: 'Untitled Puzzle Game',
  description: 'A puzzle game concept currently in early design.',

  mount() {
    // This game is not playable. The shell should never reach this code
    // because the registry marks it as coming-soon and the shell checks
    // status before mounting. If this runs, something is wrong.
    console.warn('[coming-soon-demo] This game is not playable yet.');
  },

  unmount() {
    // Nothing to clean up.
  },
};

export default game;
