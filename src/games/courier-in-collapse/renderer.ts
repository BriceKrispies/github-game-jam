import { TILE_SIZE, GRID_COLS, GRID_ROWS, COLORS } from './config';
import { TileType, type GameState } from './types';

export function createRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let dpr = 1;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;

  function resize(containerW: number, containerH: number): void {
    dpr = Math.min(window.devicePixelRatio, 2);
    const worldW = GRID_COLS * TILE_SIZE;
    const worldH = GRID_ROWS * TILE_SIZE;

    scale = Math.min(containerW / worldW, containerH / worldH);
    offsetX = (containerW - worldW * scale) / 2;
    offsetY = (containerH - worldH * scale) / 2;

    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = `${containerW}px`;
    canvas.style.height = `${containerH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(state: GameState): void {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawGrid(state);
    drawPackages(state);
    drawPlayer(state);

    ctx.restore();

    if (state.gameOver) {
      drawGameOver(state, w, h);
    }
  }

  function drawGrid(state: GameState): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = state.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        switch (tile.type) {
          case TileType.Floor:
            ctx.fillStyle = (r + c) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            break;

          case TileType.Wall:
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Brick pattern
            ctx.strokeStyle = '#5a6880';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE / 2 - 1);
            ctx.strokeRect(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1);
            ctx.strokeRect(x + 1, y + TILE_SIZE / 2, TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1);
            break;

          case TileType.Unstable:
            if (tile.collapseTimer > 0) {
              // Warning flash
              const flash = Math.sin(state.elapsed * 0.012) > 0;
              ctx.fillStyle = flash ? COLORS.unstableWarn : COLORS.unstable;
            } else {
              ctx.fillStyle = COLORS.unstable;
            }
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Crack pattern
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + TILE_SIZE * 0.3, y + TILE_SIZE * 0.2);
            ctx.lineTo(x + TILE_SIZE * 0.5, y + TILE_SIZE * 0.5);
            ctx.lineTo(x + TILE_SIZE * 0.7, y + TILE_SIZE * 0.8);
            ctx.stroke();
            break;

          case TileType.Collapsed:
            ctx.fillStyle = COLORS.collapsed;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Void pattern
            ctx.fillStyle = COLORS.collapsedPattern;
            ctx.fillRect(x + 4, y + 4, 8, 8);
            ctx.fillRect(x + 16, y + 16, 10, 10);
            ctx.fillRect(x + 20, y + 4, 6, 6);
            break;
        }

        // Terminal marker
        if (tile.hasTerminal) {
          const pulse = 0.7 + 0.3 * Math.sin(state.elapsed * 0.004 + tile.terminalId);
          ctx.fillStyle = COLORS.terminal;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          // Diamond icon
          ctx.fillStyle = COLORS.text;
          ctx.save();
          ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-4, -4, 8, 8);
          ctx.restore();
        }
      }
    }
  }

  function drawPackages(state: GameState): void {
    for (const pkg of state.packages) {
      if (!pkg.pickedUp) {
        // Draw pickup marker
        const x = pkg.pickup.col * TILE_SIZE + TILE_SIZE / 2;
        const y = pkg.pickup.row * TILE_SIZE + TILE_SIZE / 2;
        const bob = Math.sin(state.elapsed * 0.005 + pkg.id) * 2;

        ctx.fillStyle = COLORS.package;
        ctx.beginPath();
        ctx.arc(x, y + bob - 2, 8, 0, Math.PI * 2);
        ctx.fill();

        // Arrow pointing down
        ctx.fillStyle = COLORS.packageGlow;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + bob + 4);
        ctx.lineTo(x + 4, y + bob + 4);
        ctx.lineTo(x, y + bob + 9);
        ctx.fill();
      }

      // Draw delivery target (always visible)
      const dx = pkg.delivery.col * TILE_SIZE + TILE_SIZE / 2;
      const dy = pkg.delivery.row * TILE_SIZE + TILE_SIZE / 2;
      const ringPulse = 0.5 + 0.5 * Math.sin(state.elapsed * 0.006 + pkg.id * 2);

      ctx.strokeStyle = pkg.pickedUp ? COLORS.packageGlow : 'rgba(239, 71, 111, 0.3)';
      ctx.lineWidth = pkg.pickedUp ? 2.5 : 1;
      ctx.globalAlpha = pkg.pickedUp ? 1 : 0.4;
      ctx.beginPath();
      ctx.arc(dx, dy, 10 + ringPulse * 3, 0, Math.PI * 2);
      ctx.stroke();

      if (pkg.pickedUp) {
        ctx.strokeStyle = COLORS.packageGlow;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawPlayer(state: GameState): void {
    const { player } = state;
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

    const x = drawCol * TILE_SIZE + TILE_SIZE / 2;
    const y = drawRow * TILE_SIZE + TILE_SIZE / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + TILE_SIZE * 0.35, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 3, y - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1b2e';
    ctx.beginPath();
    ctx.arc(x - 2.5, y - 3.5, 1.2, 0, Math.PI * 2);
    ctx.arc(x + 3.5, y - 3.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Package indicator when carrying
    if (player.carryingPackage) {
      ctx.fillStyle = COLORS.package;
      ctx.beginPath();
      ctx.arc(x, y - 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', x, y - 16);
    }
  }

  function drawGameOver(state: GameState, w: number, h: number): void {
    ctx.fillStyle = 'rgba(26, 27, 46, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = COLORS.unstableWarn;
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('GAME OVER', w / 2, h / 2 - 50);

    ctx.fillStyle = COLORS.text;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(state.gameOverReason, w / 2, h / 2 - 15);

    ctx.fillStyle = COLORS.terminal;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`Score: ${state.score}`, w / 2, h / 2 + 25);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`${state.deliveries} deliveries | Combo: x${state.combo}`, w / 2, h / 2 + 55);

    ctx.fillStyle = COLORS.text;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Tap or press any key to restart', w / 2, h / 2 + 90);
  }

  function smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  return { resize, draw };
}
