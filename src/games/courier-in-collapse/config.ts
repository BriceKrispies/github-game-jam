// Grid & rendering
export const TILE_SIZE = 32;
export const GRID_COLS = 20;
export const GRID_ROWS = 15;

// Timing
export const MOVE_DURATION_MS = 120;       // Smooth movement interpolation time
export const COLLAPSE_INTERVAL_MS = 3000;  // Time between collapse waves
export const COLLAPSE_WARN_MS = 1500;      // Warning flash before tile collapses
export const ENERGY_TICK_MS = 800;         // Energy drain interval while moving

// Gameplay
export const STARTING_ENERGY = 100;
export const ENERGY_PER_MOVE = 1;
export const ENERGY_PER_DELIVERY = 15;
export const SCORE_PER_DELIVERY = 100;
export const SCORE_COMBO_BONUS = 50;       // Extra per consecutive delivery
export const MAX_PACKAGES = 3;             // Max active packages on map
export const UNSTABLE_STEPS_BEFORE_COLLAPSE = 3; // Steps on unstable before it falls

// Colors — bright, cheerful palette
export const COLORS = {
  floor: '#e8ecf4',
  floorAlt: '#dfe4ef',
  wall: '#6c7a99',
  unstable: '#ffd166',
  unstableWarn: '#ef476f',
  collapsed: '#2b2d42',
  collapsedPattern: '#1a1b2e',
  terminal: '#06d6a0',
  terminalActive: '#00f5b8',
  player: '#4361ee',
  playerOutline: '#3a56d4',
  package: '#ef476f',
  packageGlow: '#ff6b8a',
  energy: '#06d6a0',
  energyLow: '#ef476f',
  background: '#1a1b2e',
  text: '#ffffff',
  textDim: '#9198a8',
  hudBg: 'rgba(26, 27, 46, 0.85)',
} as const;
