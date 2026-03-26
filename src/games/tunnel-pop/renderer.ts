import { TILE, COLS, ROWS, DIRT_LAYERS, C, INFLATE_MAX } from './config';
import { Tile, Dir, type State, type Pos } from './types';

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let dpr = 1;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let cw = 0;
  let ch = 0;

  function resize(containerW: number, containerH: number): void {
    dpr = Math.min(window.devicePixelRatio, 2);
    const worldW = COLS * TILE;
    const worldH = ROWS * TILE;
    scale = Math.min(containerW / worldW, containerH / worldH);
    offsetX = (containerW - worldW * scale) / 2;
    offsetY = (containerH - worldH * scale) / 2;
    cw = containerW;
    ch = containerH;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${containerH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(state: State): void {
    const sx = state.effects.shake > 0 ? (Math.random() - 0.5) * 6 * (state.effects.shake / 350) : 0;
    const sy = state.effects.shake > 0 ? (Math.random() - 0.5) * 6 * (state.effects.shake / 350) : 0;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(offsetX + sx, offsetY + sy);
    ctx.scale(scale, scale);

    drawGrid(state);
    drawBeam(state);
    drawEnemies(state);
    if (state.player.alive) drawPlayer(state);
    drawEffects(state);

    ctx.restore();

    if (state.phase === 'roundClear') drawRoundClear(state);
    if (state.phase === 'gameOver') drawGameOver(state);
  }

  // ── Grid ──

  function drawGrid(state: State): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = state.grid[r][c];
        const x = c * TILE;
        const y = r * TILE;

        switch (tile) {
          case Tile.Tunnel:
            ctx.fillStyle = C.tunnel;
            ctx.fillRect(x, y, TILE, TILE);
            break;

          case Tile.Dirt: {
            const layer = DIRT_LAYERS.find(l => r <= l.maxRow) ?? DIRT_LAYERS[DIRT_LAYERS.length - 1];
            ctx.fillStyle = (r + c) % 2 === 0 ? layer.light : layer.dark;
            ctx.fillRect(x, y, TILE, TILE);
            // Subtle dot pattern
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.beginPath();
            ctx.arc(x + TILE * 0.3, y + TILE * 0.4, 1.5, 0, Math.PI * 2);
            ctx.arc(x + TILE * 0.7, y + TILE * 0.7, 1, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case Tile.Rock:
            ctx.fillStyle = C.rock;
            ctx.fillRect(x, y, TILE, TILE);
            // Bevel
            ctx.fillStyle = C.rockEdge;
            ctx.fillRect(x, y + TILE - 3, TILE, 3);
            ctx.fillRect(x + TILE - 3, y, 3, TILE);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x, y, TILE, 2);
            ctx.fillRect(x, y, 2, TILE);
            break;
        }
      }
    }
  }

  // ── Beam ──

  function drawBeam(state: State): void {
    if (!state.beam) return;

    const alpha = Math.min(1, state.beam.timer / 100);
    const pPos = state.player.pos;

    // Glow line from player to end
    ctx.strokeStyle = C.beamGlow;
    ctx.lineWidth = 10;
    ctx.globalAlpha = alpha * 0.5;

    const startX = pPos.col * TILE + TILE / 2;
    const startY = pPos.row * TILE + TILE / 2;

    if (state.beam.tiles.length > 0) {
      const last = state.beam.tiles[state.beam.tiles.length - 1];
      const endX = last.col * TILE + TILE / 2;
      const endY = last.row * TILE + TILE / 2;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Core beam
      ctx.strokeStyle = C.beam;
      ctx.lineWidth = 3;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Impact circle
      if (state.beam.hitEnemy) {
        ctx.fillStyle = C.beam;
        ctx.beginPath();
        ctx.arc(endX, endY, 6 + (1 - alpha) * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }

  // ── Enemies ──

  function drawEnemies(state: State): void {
    for (const e of state.enemies) {
      if (!e.alive) continue;

      const drawPos = interpPos(e.prev, e.pos, e.t);
      const x = drawPos.col * TILE + TILE / 2;
      const y = drawPos.row * TILE + TILE / 2;

      // Size scales with inflation
      const baseR = TILE * 0.38;
      const inflateScale = 1 + e.inflate * 0.22;
      const r = baseR * inflateScale;

      // Ghost mode
      if (e.ghost && e.inflate === 0) {
        ctx.globalAlpha = 0.45;
      }

      // Body color based on inflate stage
      let bodyColor: string = C.enemy;
      if (e.inflate === 1) bodyColor = C.enemyInflate1;
      else if (e.inflate >= 2) bodyColor = C.enemyInflate2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.8, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(x, y - 1, r, 0, Math.PI * 2);
      ctx.fill();

      // Darker bottom half
      ctx.fillStyle = C.enemyDark;
      ctx.beginPath();
      ctx.arc(x, y - 1, r, 0, Math.PI);
      ctx.fill();

      // Eyes
      ctx.fillStyle = C.enemyEye;
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2);
      ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = C.enemyPupil;
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y - r * 0.15, r * 0.12, 0, Math.PI * 2);
      ctx.arc(x + r * 0.35, y - r * 0.15, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Inflate warning at stage 2
      if (e.inflate >= 2) {
        const pulse = 0.5 + 0.5 * Math.sin(state.elapsed * 0.015);
        ctx.strokeStyle = `rgba(239,68,68,${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y - 1, r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }

  // ── Player ──

  function drawPlayer(state: State): void {
    const p = state.player;

    // Invuln blink
    if (p.invulnTimer > 0 && Math.floor(state.elapsed / 80) % 2 === 0) return;

    const drawPos = interpPos(p.prev, p.pos, p.t);
    const x = drawPos.col * TILE + TILE / 2;
    const y = drawPos.row * TILE + TILE / 2;
    const r = TILE * 0.4;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.8, r * 0.65, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = C.player;
    ctx.beginPath();
    ctx.arc(x, y - 1, r, 0, Math.PI * 2);
    ctx.fill();

    // Darker bottom
    ctx.fillStyle = C.playerDark;
    ctx.beginPath();
    ctx.arc(x, y - 1, r, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.4, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Eyes - look in facing direction
    const eyeOff = facingOffset(p.facing);
    ctx.fillStyle = C.playerEye;
    ctx.beginPath();
    ctx.arc(x - 3 + eyeOff.x, y - 3 + eyeOff.y, 3, 0, Math.PI * 2);
    ctx.arc(x + 3 + eyeOff.x, y - 3 + eyeOff.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.playerPupil;
    ctx.beginPath();
    ctx.arc(x - 2.5 + eyeOff.x * 1.5, y - 2.5 + eyeOff.y * 1.5, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 3.5 + eyeOff.x * 1.5, y - 2.5 + eyeOff.y * 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Effects ──

  function drawEffects(state: State): void {
    // Particles
    for (const p of state.effects.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Score popups
    for (const p of state.effects.popups) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = C.scorePopup;
      ctx.font = `bold ${14 + (1 - p.life) * 4}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  // ── Overlays ──

  function drawRoundClear(state: State): void {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.roundText;
    ctx.font = `bold ${Math.min(cw * 0.08, 30)}px system-ui, sans-serif`;
    ctx.fillText(`ROUND ${state.round + 1}`, cw / 2, ch / 2 - 10);

    ctx.fillStyle = C.textMuted;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Get ready...', cw / 2, ch / 2 + 18);
  }

  function drawGameOver(state: State): void {
    ctx.fillStyle = 'rgba(10,6,4,0.8)';
    ctx.fillRect(0, 0, cw, ch);

    const cx = cw / 2;
    const cy = ch / 2;

    // Card
    const cardW = Math.min(260, cw - 32);
    const cardH = 180;
    ctx.fillStyle = 'rgba(30,20,14,0.95)';
    rr(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    rr(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 14);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('GAME OVER', cx, cy - 52);

    ctx.fillStyle = C.textPrimary;
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(String(state.score), cx, cy - 8);

    ctx.fillStyle = C.textMuted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`Round ${state.round}`, cx, cy + 26);

    ctx.fillStyle = C.textMuted;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Tap to restart', cx, cy + 60);
  }

  // ── Util ──

  function interpPos(prev: Pos, curr: Pos, t: number): { col: number; row: number } {
    const st = t * t * (3 - 2 * t); // smoothstep
    return {
      col: prev.col + (curr.col - prev.col) * st,
      row: prev.row + (curr.row - prev.row) * st,
    };
  }

  function facingOffset(dir: Dir): { x: number; y: number } {
    switch (dir) {
      case Dir.Up: return { x: 0, y: -1.5 };
      case Dir.Down: return { x: 0, y: 1.5 };
      case Dir.Left: return { x: -1.5, y: 0 };
      case Dir.Right: return { x: 1.5, y: 0 };
    }
  }

  function rr(x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return { resize, draw };
}
