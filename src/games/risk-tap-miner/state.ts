import {
  BASE_SCORE_PER_TAP,
  SCORE_GROWTH,
  BASE_HAZARD_CHANCE,
  HAZARD_GROWTH_PER_TAP,
  HAZARD_ACCEL_DEPTH,
  HAZARD_ACCEL_FACTOR,
  FAIL_DISPLAY_MS,
  CASHOUT_DISPLAY_MS,
} from './config';
import type { GameState } from './types';

export function createInitialState(): GameState {
  return {
    depth: 0,
    runScore: 0,
    bankedScore: 0,
    bestRun: 0,
    hazardChance: BASE_HAZARD_CHANCE,
    runActive: true,
    phase: 'mining',
    phaseTimer: 0,
    ripples: [],
    shakeTimer: 0,
    cashoutFlash: 0,
    lastTapScore: 0,
  };
}

export function tap(state: GameState, x: number, y: number): void {
  if (!state.runActive || state.phase !== 'mining') return;

  state.depth++;

  // Score: scales with depth
  const earned = Math.floor(BASE_SCORE_PER_TAP * Math.pow(SCORE_GROWTH, state.depth - 1));
  state.runScore += earned;
  state.lastTapScore = earned;

  // Ripple
  state.ripples.push({ x, y, age: 0, score: earned });

  // Update hazard chance
  const growth = state.depth > HAZARD_ACCEL_DEPTH
    ? HAZARD_GROWTH_PER_TAP * HAZARD_ACCEL_FACTOR
    : HAZARD_GROWTH_PER_TAP;
  state.hazardChance = BASE_HAZARD_CHANCE + growth * state.depth;

  // Hazard roll
  if (Math.random() < state.hazardChance) {
    triggerFail(state);
  }
}

export function cashOut(state: GameState): void {
  if (!state.runActive || state.phase !== 'mining' || state.depth === 0) return;

  state.bankedScore += state.runScore;
  if (state.runScore > state.bestRun) state.bestRun = state.runScore;
  state.cashoutFlash = CASHOUT_DISPLAY_MS;
  state.phase = 'cashed';
  state.phaseTimer = CASHOUT_DISPLAY_MS;
  state.runActive = false;
}

function triggerFail(state: GameState): void {
  if (state.runScore > state.bestRun) state.bestRun = state.runScore;
  state.runActive = false;
  state.phase = 'failed';
  state.phaseTimer = FAIL_DISPLAY_MS;
  state.shakeTimer = 300;
  state.runScore = 0;
}

export function resetRun(state: GameState): void {
  state.depth = 0;
  state.runScore = 0;
  state.hazardChance = BASE_HAZARD_CHANCE;
  state.runActive = true;
  state.phase = 'mining';
  state.phaseTimer = 0;
  state.ripples = [];
  state.lastTapScore = 0;
}

export function update(state: GameState, dt: number): void {
  const dtMs = dt * 1000;

  // Tick ripples
  for (const r of state.ripples) r.age += dtMs;
  state.ripples = state.ripples.filter(r => r.age < 500);

  // Tick shake
  if (state.shakeTimer > 0) state.shakeTimer = Math.max(0, state.shakeTimer - dtMs);

  // Tick cashout flash
  if (state.cashoutFlash > 0) state.cashoutFlash = Math.max(0, state.cashoutFlash - dtMs);

  // Tick phase timer
  if (state.phaseTimer > 0) {
    state.phaseTimer = Math.max(0, state.phaseTimer - dtMs);
    if (state.phaseTimer <= 0) {
      resetRun(state);
    }
  }
}
