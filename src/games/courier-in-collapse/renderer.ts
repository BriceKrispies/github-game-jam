import { TILE_SIZE, GRID_COLS, GRID_ROWS, COLORS } from './config';
import { TileType, type GameState } from './types';

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let dpr = 1;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let canvasW = 0;
  let canvasH = 0;

  function resize(containerW: number, containerH: number): void {
    dpr = Math.min(window.devicePixelRatio, 2);
    const worldW = GRID_COLS * TILE_SIZE;
    const worldH = GRID_ROWS * TILE_SIZE;

    // Fill container as much as possible
    scale = Math.min(containerW / worldW, containerH / worldH);
    offsetX = (containerW - worldW * scale) / 2;
    offsetY = (containerH - worldH * scale) / 2;

    canvasW = containerW;
    canvasH = containerH;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${containerH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(state: GameState): void {
    // Clear with light background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Board shadow
    const bw = GRID_COLS * TILE_SIZE;
    const bh = GRID_ROWS * TILE_SIZE;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, bw, bh);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawGrid(state);
    drawPackages(state);
    drawPlayer(state);

    // Delivery flash overlay
    if (state.deliveryFlash > 0) {
      const alpha = (state.deliveryFlash / 400) * 0.12;
      ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.fillRect(0, 0, bw, bh);
    }

    ctx.restore();

    if (state.gameOver) {
      drawGameOver(state);
    }
  }

  function drawGrid(state: GameState): void {
    const ts = TILE_SIZE;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = state.grid[r][c];
        const x = c * ts;
        const y = r * ts;

        switch (tile.type) {
          case TileType.Floor:
            ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
            ctx.fillRect(x, y, ts, ts);
            break;

          case TileType.Wall:
            ctx.fillStyle = COLORS.wall;
            roundRect(ctx, x + 1, y + 1, ts - 2, ts - 2, 3);
            ctx.fill();
            // Subtle top edge highlight
            ctx.fillStyle = COLORS.wallEdge;
            ctx.fillRect(x + 2, y + 1, ts - 4, 2);
            break;

          case TileType.Unstable: {
            const collapsing = tile.collapseTimer > 0;
            if (collapsing) {
              const flash = Math.sin(state.elapsed * 0.015) > 0;
              ctx.fillStyle = flash ? COLORS.unstableWarn : COLORS.unstable;
            } else {
              ctx.fillStyle = COLORS.unstable;
            }
            ctx.fillRect(x, y, ts, ts);
            // Single clean crack line
            ctx.strokeStyle = COLORS.unstableCrack;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + ts * 0.25, y + ts * 0.3);
            ctx.lineTo(x + ts * 0.55, y + ts * 0.55);
            ctx.lineTo(x + ts * 0.7, y + ts * 0.75);
            ctx.stroke();
            break;
          }

          case TileType.Collapsed:
            ctx.fillStyle = COLORS.collapsed;
            ctx.fillRect(x, y, ts, ts);
            // Simple inner void
            ctx.fillStyle = COLORS.collapsedInner;
            roundRect(ctx, x + 4, y + 4, ts - 8, ts - 8, 2);
            ctx.fill();
            break;
        }

        // Terminal marker
        if (tile.hasTerminal) {
          drawTerminal(state, x, y, ts, tile.terminalId);
        }
      }
    }
  }

  function drawTerminal(state: GameState, x: number, y: number, ts: number, terminalId: number): void {
    const cx = x + ts / 2;
    const cy = y + ts / 2;

    // Check if this terminal is an active pickup or delivery
    let isPickup = false;
    let isDelivery = false;
    for (const pkg of state.packages) {
      if (!pkg.pickedUp && pkg.pickup.col === Math.floor(x / ts) && pkg.pickup.row === Math.floor(y / ts)) {
        isPickup = true;
      }
      if (pkg.delivery.col === Math.floor(x / ts) && pkg.delivery.row === Math.floor(y / ts)) {
        isDelivery = true;
      }
    }

    if (isPickup) return; // Pickup draws its own marker
    if (isDelivery) return; // Delivery draws its own marker

    // Neutral terminal: subtle diamond
    const pulse = 0.6 + 0.4 * Math.sin(state.elapsed * 0.003 + terminalId * 1.5);
    ctx.globalAlpha = pulse * 0.5;
    ctx.fillStyle = COLORS.terminal;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawPackages(state: GameState): void {
    const ts = TILE_SIZE;

    for (const pkg of state.packages) {
      // Pickup marker
      if (!pkg.pickedUp) {
        const px = pkg.pickup.col * ts + ts / 2;
        const py = pkg.pickup.row * ts + ts / 2;
        const bob = Math.sin(state.elapsed * 0.005 + pkg.id) * 2;

        // Glow
        ctx.fillStyle = COLORS.pickupGlow;
        ctx.beginPath();
        ctx.arc(px, py, ts * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Package box shape
        ctx.fillStyle = COLORS.pickup;
        roundRect(ctx, px - 7, py - 7 + bob, 14, 14, 3);
        ctx.fill();

        // Arrow down
        ctx.fillStyle = COLORS.pickup;
        ctx.beginPath();
        ctx.moveTo(px - 3, py + 9 + bob);
        ctx.lineTo(px + 3, py + 9 + bob);
        ctx.lineTo(px, py + 13 + bob);
        ctx.fill();
      }

      // Delivery target
      const dx = pkg.delivery.col * ts + ts / 2;
      const dy = pkg.delivery.row * ts + ts / 2;

      if (pkg.pickedUp) {
        // Active delivery: bold pulsing target
        const ringSize = 10 + Math.sin(state.elapsed * 0.008) * 2;

        ctx.fillStyle = COLORS.deliveryGlow;
        ctx.beginPath();
        ctx.arc(dx, dy, ts * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLORS.delivery;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(dx, dy, ringSize, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = COLORS.delivery;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Inactive delivery: subtle ring
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = COLORS.delivery;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dx, dy, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawPlayer(state: GameState): void {
    const { player } = state;
    const ts = TILE_SIZE;
    let drawCol: number;
    let drawRow: number;

    if (player.moving) {
      const t = smoothStep(player.moveProgress);
      drawCol = player.prevPos.col + (player.pos.col - player.prevPos.col) * t;
      drawRow = player.prevPos.row + (player.pos.row - player.prevPos.row) * t;
    } else {
      drawCol = player.pos.col;
      drawRow = player.pos.row;
    }

    const x = drawCol * ts + ts / 2;
    const y = drawRow * ts + ts / 2;

    // Drop shadow
    ctx.fillStyle = COLORS.playerShadow;
    ctx.beginPath();
    ctx.ellipse(x, y + ts * 0.3, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(x, y - 1, 11, 0, Math.PI * 2);
    ctx.fill();

    // Highlight arc (top-left shine)
    ctx.fillStyle = COLORS.playerHighlight;
    ctx.beginPath();
    ctx.arc(x - 2, y - 4, 5, Math.PI, Math.PI * 1.7);
    ctx.lineTo(x - 2, y - 4);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 3.5, y - 3, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 3.5, y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x - 3, y - 2.5, 1.3, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 2.5, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Carrying indicator
    if (player.carryingPackage) {
      const bob = Math.sin(state.elapsed * 0.008) * 1.5;
      ctx.fillStyle = COLORS.pickup;
      roundRect(ctx, x - 5, y - 18 + bob, 10, 10, 2);
      ctx.fill();
    }
  }

  function drawGameOver(state: GameState): void {
    // Overlay
    ctx.fillStyle = COLORS.overlayBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const cx = canvasW / 2;
    const cy = canvasH / 2;

    // Card background
    const cardW = Math.min(280, canvasW - 40);
    const cardH = 200;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    ctx.fill();

    // Shadow for card
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 16);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Game Over', cx, cy - 60);

    // Reason
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(state.gameOverReason, cx, cy - 32);

    // Score
    ctx.fillStyle = COLORS.player;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText(String(state.score), cx, cy + 10);

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${state.deliveries} deliveries`, cx, cy + 38);

    if (state.combo > 1) {
      ctx.fillStyle = COLORS.pickup;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`Best combo: x${state.combo}`, cx, cy + 56);
    }

    // Restart hint
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Tap or press any key', cx, cy + 82);
  }

  function smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
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
