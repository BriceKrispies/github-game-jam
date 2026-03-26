// Grid & rendering — portrait-friendly for mobile-first
export const TILE_SIZE = 32;
export const GRID_COLS = 11;
export const GRID_ROWS = 14;

// Timing
export const MOVE_DURATION_MS = 80;        // Snappy movement
export const COLLAPSE_INTERVAL_MS = 3000;
export const COLLAPSE_WARN_MS = 1500;
export const ENERGY_TICK_MS = 800;

// Gameplay
export const STARTING_ENERGY = 100;
export const ENERGY_PER_MOVE = 1;
export const ENERGY_PER_DELIVERY = 15;
export const SCORE_PER_DELIVERY = 100;
export const SCORE_COMBO_BONUS = 50;
export const MAX_PACKAGES = 3;
export const UNSTABLE_STEPS_BEFORE_COLLAPSE = 3;

// Visual — clean, light, modern palette
export const COLORS = {
  background: '#f0f2f5',

  floor: '#ffffff',
  floorAlt: '#f7f8fa',
  wall: '#c4cad6',
  wallEdge: '#b0b8c6',
  unstable: '#fde68a',
  unstableWarn: '#f87171',
  unstableCrack: 'rgba(0,0,0,0.10)',
  collapsed: '#d1d5db',
  collapsedInner: '#e5e7eb',

  terminal: '#a78bfa',
  terminalGlow: 'rgba(167, 139, 250, 0.25)',

  player: '#3b82f6',
  playerHighlight: '#60a5fa',
  playerShadow: 'rgba(59, 130, 246, 0.25)',

  pickup: '#f97316',
  pickupGlow: 'rgba(249, 115, 22, 0.2)',
  delivery: '#10b981',
  deliveryGlow: 'rgba(16, 185, 129, 0.25)',
  deliveryRing: '#34d399',

  energy: '#3b82f6',
  energyLow: '#ef4444',
  energyTrack: 'rgba(0,0,0,0.08)',

  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#ffffff',

  hudBg: 'rgba(255,255,255,0.88)',
  hudBorder: 'rgba(0,0,0,0.06)',

  overlayBg: 'rgba(15, 23, 42, 0.75)',
} as const;
