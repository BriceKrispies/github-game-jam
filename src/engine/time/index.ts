import type { TimeInfo } from '../contracts';

const MAX_DELTA = 0.05; // 50ms cap — prevents spiral of death

export interface Clock {
  /** Call at the start of each frame with performance.now(). Returns delta in seconds. */
  tick(now: number): number;
  /** Current time info snapshot. */
  readonly info: TimeInfo;
  /** Reset the clock (e.g. after a pause). */
  reset(now: number): void;
}

export function createClock(): Clock {
  let lastTime = 0;
  let elapsed = 0;
  let frame = 0;
  let delta = 0;
  let started = false;

  const info: TimeInfo = {
    get delta() { return delta; },
    get elapsed() { return elapsed; },
    get frame() { return frame; },
  };

  return {
    tick(now: number): number {
      if (!started) {
        lastTime = now;
        started = true;
        delta = 0;
        return 0;
      }

      const raw = (now - lastTime) / 1000;
      delta = Math.min(raw, MAX_DELTA);
      lastTime = now;
      elapsed += delta;
      frame++;
      return delta;
    },

    get info() { return info; },

    reset(now: number): void {
      lastTime = now;
      delta = 0;
    },
  };
}
