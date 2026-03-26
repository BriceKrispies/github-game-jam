import { TILE } from './config';
import type { Effects, Pos } from './types';

export function createEffects(): Effects {
  return { particles: [], popups: [], shake: 0 };
}

export function spawnDigParticles(fx: Effects, pos: Pos, color: string): void {
  const cx = pos.col * TILE + TILE / 2;
  const cy = pos.row * TILE + TILE / 2;
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    fx.particles.push({
      x: cx + (Math.random() - 0.5) * 8,
      y: cy + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 2.5 + Math.random(),
      color,
      size: 2 + Math.random() * 2,
    });
  }
}

export function spawnPopParticles(fx: Effects, pos: Pos, color: string): void {
  const cx = pos.col * TILE + TILE / 2;
  const cy = pos.row * TILE + TILE / 2;
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    fx.particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      life: 1,
      decay: 1.5 + Math.random() * 0.5,
      color,
      size: 3 + Math.random() * 3,
    });
  }
}

export function spawnPopup(fx: Effects, pos: Pos, text: string): void {
  fx.popups.push({
    x: pos.col * TILE + TILE / 2,
    y: pos.row * TILE + TILE / 2,
    text,
    life: 1,
  });
}

export function updateEffects(fx: Effects, dt: number): void {
  // Particles
  for (const p of fx.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt; // gravity
    p.life -= p.decay * dt;
  }
  fx.particles = fx.particles.filter(p => p.life > 0);

  // Popups
  for (const p of fx.popups) {
    p.y -= 30 * dt;
    p.life -= 1.2 * dt;
  }
  fx.popups = fx.popups.filter(p => p.life > 0);

  // Shake
  if (fx.shake > 0) fx.shake = Math.max(0, fx.shake - dt * 1000);
}
