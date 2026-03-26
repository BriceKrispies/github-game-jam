export const TILE = 28;
export const COLS = 13;
export const ROWS = 15;

// Speed (ms per grid tile)
export const PLAYER_SPEED = 90;
export const ENEMY_SPEED = 150;
export const ENEMY_GHOST_SPEED = 190;

// Attack
export const ATTACK_RANGE = 3;
export const ATTACK_FLASH_MS = 200;
export const ATTACK_COOLDOWN_MS = 350;

// Inflate / pop
export const INFLATE_MAX = 3;
export const DEFLATE_MS = 1800;

// Ghost mode
export const GHOST_COOLDOWN_MIN = 5000;
export const GHOST_COOLDOWN_MAX = 9000;
export const GHOST_DURATION = 3000;

// Player
export const LIVES = 3;
export const RESPAWN_MS = 1200;
export const INVULN_MS = 1500;

// Rounds
export const ENEMIES_START = 4;
export const ENEMIES_PER_ROUND = 1;
export const ENEMIES_CAP = 8;
export const ROUND_DELAY_MS = 1800;

// Scoring
export const PTS_DIG = 10;
export const PTS_POP_BASE = 200;

// Spawn positions (col, row) — placed inside dirt
export const SPAWN_POSITIONS: [number, number][] = [
  [3, 5], [9, 5],
  [6, 7],
  [3, 9], [9, 9],
  [6, 11],
  [3, 12], [9, 12],
];

export const PLAYER_START: [number, number] = [6, 2];

// Dirt layer colors (by row range)
export const DIRT_LAYERS: { maxRow: number; light: string; dark: string }[] = [
  { maxRow: 5, light: '#d4a574', dark: '#c4956a' },
  { maxRow: 8, light: '#b8845c', dark: '#a87450' },
  { maxRow: 11, light: '#9c6b44', dark: '#8c5b38' },
  { maxRow: 99, light: '#7a4e2e', dark: '#6a3e24' },
];

export const C = {
  tunnel: '#120a06',
  rock: '#78839a',
  rockEdge: '#636e84',

  player: '#22d3ee',
  playerDark: '#0ea5e9',
  playerEye: '#fff',
  playerPupil: '#164e63',

  enemy: '#fb923c',
  enemyDark: '#ea780f',
  enemyInflate1: '#f87171',
  enemyInflate2: '#ef4444',
  enemyEye: '#fff',
  enemyPupil: '#7f1d1d',
  enemyGhost: 'rgba(251,146,60,0.45)',

  beam: '#fde047',
  beamGlow: 'rgba(253,224,71,0.35)',

  bg: '#0a0604',

  textPrimary: '#f8fafc',
  textMuted: '#94a3b8',
  hudBg: 'rgba(0,0,0,0.55)',
  scorePopup: '#fde047',
  roundText: '#22d3ee',
} as const;
