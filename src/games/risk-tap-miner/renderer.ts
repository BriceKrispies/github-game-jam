import { COLORS, MAX_DEPTH_VISUAL, RIPPLE_DURATION_MS } from './config';
import type { GameState } from './types';

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let dpr = 1;
  let w = 0;
  let h = 0;

  function resize(containerW: number, containerH: number): void {
    dpr = Math.min(window.devicePixelRatio, 2);
    w = containerW;
    h = containerH;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${containerH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(state: GameState, elapsed: number): void {
    // Shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (state.shakeTimer > 0) {
      const intensity = (state.shakeTimer / 300) * 6;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBackground(state);
    drawDepthMeter(state);
    drawRipples(state);
    drawCenterContent(state, elapsed);

    ctx.restore();

    // Failure flash overlay
    if (state.phase === 'failed' && state.phaseTimer > 800) {
      const alpha = ((state.phaseTimer - 800) / 400) * 0.25;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Cashout flash overlay
    if (state.cashoutFlash > 400) {
      const alpha = ((state.cashoutFlash - 400) / 400) * 0.15;
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawBackground(state: GameState): void {
    const depthPct = Math.min(state.depth / MAX_DEPTH_VISUAL, 1);

    // Interpolate between light surface and deep dark
    const topR = lerp(248, 30, depthPct);
    const topG = lerp(250, 41, depthPct);
    const topB = lerp(252, 59, depthPct);
    const botR = lerp(226, 15, depthPct);
    const botG = lerp(232, 23, depthPct);
    const botB = lerp(240, 42, depthPct);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgb(${topR},${topG},${topB})`);
    grad.addColorStop(1, `rgb(${botR},${botG},${botB})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawDepthMeter(state: GameState): void {
    const depthPct = Math.min(state.depth / MAX_DEPTH_VISUAL, 1);
    const meterW = 4;
    const meterH = h * 0.6;
    const meterX = w - 16;
    const meterY = (h - meterH) / 2;

    // Track
    ctx.fillStyle = COLORS.depthMeterTrack;
    roundRect(ctx, meterX, meterY, meterW, meterH, 2);
    ctx.fill();

    // Fill (from bottom up)
    const fillH = meterH * depthPct;
    let fillColor: string = COLORS.depthMeterFill;
    if (depthPct > 0.7) fillColor = COLORS.depthMeterCritical;
    else if (depthPct > 0.4) fillColor = COLORS.depthMeterDanger;

    ctx.fillStyle = fillColor;
    roundRect(ctx, meterX, meterY + meterH - fillH, meterW, fillH, 2);
    ctx.fill();
  }

  function drawRipples(state: GameState): void {
    for (const ripple of state.ripples) {
      const progress = ripple.age / RIPPLE_DURATION_MS;
      if (progress >= 1) continue;

      const radius = 20 + progress * 60;
      const alpha = (1 - progress) * 0.4;

      ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
      ctx.lineWidth = 2 * (1 - progress);
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Floating score number
      const scoreAlpha = 1 - progress;
      const scoreY = ripple.y - 30 - progress * 40;
      const depthPct = Math.min(state.depth / MAX_DEPTH_VISUAL, 1);
      const textColor = depthPct > 0.5 ? '255,255,255' : '30,41,59';
      ctx.fillStyle = `rgba(${textColor}, ${scoreAlpha})`;
      ctx.font = `bold ${14 + progress * 4}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${ripple.score}`, ripple.x, scoreY);
    }
  }

  function drawCenterContent(state: GameState, elapsed: number): void {
    const cx = w / 2;
    const depthPct = Math.min(state.depth / MAX_DEPTH_VISUAL, 1);
    const isDeep = depthPct > 0.5;

    if (state.phase === 'mining') {
      // Depth number — large, central
      const breathe = 1 + Math.sin(elapsed * 0.003) * 0.02;
      ctx.save();
      ctx.translate(cx, h * 0.38);
      ctx.scale(breathe, breathe);
      ctx.fillStyle = isDeep ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.9)';
      ctx.font = `bold ${Math.min(w * 0.2, 80)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(state.depth), 0, 0);
      ctx.restore();

      // "depth" label
      ctx.fillStyle = isDeep ? 'rgba(255,255,255,0.4)' : 'rgba(148,163,184,1)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEPTH', cx, h * 0.38 + Math.min(w * 0.1, 42) + 8);

      // Hazard warning at high risk
      if (state.hazardChance > 0.3) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.01);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.5})`;
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText('HIGH RISK', cx, h * 0.38 + Math.min(w * 0.1, 42) + 28);
      }

      // Tap prompt (only at start)
      if (state.depth === 0) {
        const fade = 0.4 + 0.3 * Math.sin(elapsed * 0.004);
        ctx.fillStyle = isDeep ? `rgba(255,255,255,${fade})` : `rgba(100,116,139,${fade})`;
        ctx.font = '15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tap to mine', cx, h * 0.55);
      }
    }

    if (state.phase === 'failed') {
      // Failure display
      ctx.fillStyle = COLORS.hazard;
      ctx.font = `bold ${Math.min(w * 0.09, 32)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('COLLAPSED', cx, h * 0.35);

      ctx.fillStyle = isDeep ? 'rgba(255,255,255,0.7)' : 'rgba(100,116,139,1)';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Reached depth ${state.depth}`, cx, h * 0.35 + 30);

      if (state.bestRun > 0) {
        ctx.fillStyle = isDeep ? 'rgba(255,255,255,0.4)' : 'rgba(148,163,184,1)';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(`Best run: ${state.bestRun}`, cx, h * 0.35 + 52);
      }
    }

    if (state.phase === 'cashed') {
      // Cashout celebration
      const scale = 1 + (state.cashoutFlash / 800) * 0.1;
      ctx.save();
      ctx.translate(cx, h * 0.35);
      ctx.scale(scale, scale);
      ctx.fillStyle = COLORS.cashOut;
      ctx.font = `bold ${Math.min(w * 0.08, 28)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BANKED!', 0, 0);
      ctx.restore();

      ctx.fillStyle = COLORS.cashOut;
      ctx.font = `bold ${Math.min(w * 0.12, 40)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`+${state.lastTapScore > 0 ? state.runScore : state.runScore}`, cx, h * 0.35 + 38);
    }
  }

  function lerp(a: number, b: number, t: number): number {
    return Math.round(a + (b - a) * t);
  }

  function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  return { resize, draw };
}
