export interface Ripple {
  x: number;
  y: number;
  age: number;       // ms since created
  score: number;     // score gained on this tap
}

export interface GameState {
  depth: number;
  runScore: number;
  bankedScore: number;
  bestRun: number;
  hazardChance: number;
  runActive: boolean;

  // Visual state
  phase: 'mining' | 'failed' | 'cashed';
  phaseTimer: number;       // ms remaining in fail/cash display
  ripples: Ripple[];
  shakeTimer: number;       // ms remaining for screen shake
  cashoutFlash: number;     // ms remaining for cashout glow
  lastTapScore: number;     // score from most recent tap (for display)
}
