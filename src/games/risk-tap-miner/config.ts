// Scoring
export const BASE_SCORE_PER_TAP = 10;
export const SCORE_GROWTH = 1.12;          // Multiplier per depth level

// Hazard
export const BASE_HAZARD_CHANCE = 0.02;    // 2% at depth 1
export const HAZARD_GROWTH_PER_TAP = 0.018; // +1.8% per tap
export const HAZARD_ACCEL_DEPTH = 15;      // After this depth, growth accelerates
export const HAZARD_ACCEL_FACTOR = 1.6;    // Acceleration multiplier

// Timing
export const FAIL_DISPLAY_MS = 1200;       // How long failure state shows
export const CASHOUT_DISPLAY_MS = 800;     // How long cashout celebration shows

// Visual
export const MAX_DEPTH_VISUAL = 40;        // Depth at which visual intensity maxes out
export const RIPPLE_DURATION_MS = 400;
export const SHAKE_DURATION_MS = 300;

// Colors
export const COLORS = {
  // Background gradient stops (shift as depth increases)
  bgTop: '#f8fafc',
  bgBottom: '#e2e8f0',
  bgDeepTop: '#1e293b',
  bgDeepBottom: '#0f172a',

  // Tap zone
  mineButton: '#3b82f6',
  mineButtonHover: '#2563eb',
  mineButtonActive: '#1d4ed8',
  mineRipple: 'rgba(59, 130, 246, 0.3)',

  // Cash out
  cashOut: '#10b981',
  cashOutHover: '#059669',
  cashOutActive: '#047857',

  // Hazard / failure
  hazard: '#ef4444',
  hazardFlash: '#fca5a5',

  // Score
  scoreText: '#1e293b',
  scoreGain: '#10b981',
  scoreLoss: '#ef4444',
  bankedText: '#64748b',

  // Depth meter
  depthMeterTrack: 'rgba(0,0,0,0.06)',
  depthMeterFill: '#3b82f6',
  depthMeterDanger: '#f59e0b',
  depthMeterCritical: '#ef4444',

  // General
  text: '#1e293b',
  textLight: '#ffffff',
  textMuted: '#94a3b8',
  overlay: 'rgba(15, 23, 42, 0.6)',
} as const;
