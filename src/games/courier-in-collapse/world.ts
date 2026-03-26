import { GRID_COLS, GRID_ROWS } from './config';
import { TileType, type Tile, type Position } from './types';

/** Simple seeded RNG for reproducible worlds */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWorld(seed?: number): {
  grid: Tile[][];
  playerStart: Position;
  terminals: Position[];
} {
  const rng = mulberry32(seed ?? (Date.now() & 0xffffffff));

  // Initialize all as floor
  const grid: Tile[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      grid[r][c] = {
        type: TileType.Floor,
        stepsOnIt: 0,
        collapseTimer: 0,
        hasTerminal: false,
        terminalId: -1,
      };
    }
  }

  // Border walls
  for (let c = 0; c < GRID_COLS; c++) {
    grid[0][c].type = TileType.Wall;
    grid[GRID_ROWS - 1][c].type = TileType.Wall;
  }
  for (let r = 0; r < GRID_ROWS; r++) {
    grid[r][0].type = TileType.Wall;
    grid[r][GRID_COLS - 1].type = TileType.Wall;
  }

  // Scatter interior walls (sparse clusters)
  const wallCount = Math.floor(GRID_COLS * GRID_ROWS * 0.08);
  for (let i = 0; i < wallCount; i++) {
    const c = 2 + Math.floor(rng() * (GRID_COLS - 4));
    const r = 2 + Math.floor(rng() * (GRID_ROWS - 4));
    grid[r][c].type = TileType.Wall;
    // Occasionally extend wall
    if (rng() > 0.5 && c + 1 < GRID_COLS - 1) grid[r][c + 1].type = TileType.Wall;
    if (rng() > 0.6 && r + 1 < GRID_ROWS - 1) grid[r + 1][c].type = TileType.Wall;
  }

  // Scatter unstable tiles
  const unstableCount = Math.floor(GRID_COLS * GRID_ROWS * 0.12);
  for (let i = 0; i < unstableCount; i++) {
    const c = 1 + Math.floor(rng() * (GRID_COLS - 2));
    const r = 1 + Math.floor(rng() * (GRID_ROWS - 2));
    if (grid[r][c].type === TileType.Floor) {
      grid[r][c].type = TileType.Unstable;
    }
  }

  // Place terminals in spread-out positions
  const terminals: Position[] = [];
  const terminalTarget = 6;
  const minDist = 4;
  let attempts = 0;

  while (terminals.length < terminalTarget && attempts < 500) {
    attempts++;
    const c = 2 + Math.floor(rng() * (GRID_COLS - 4));
    const r = 2 + Math.floor(rng() * (GRID_ROWS - 4));
    if (grid[r][c].type !== TileType.Floor && grid[r][c].type !== TileType.Unstable) continue;

    // Check distance from other terminals
    const tooClose = terminals.some(
      (t) => Math.abs(t.col - c) + Math.abs(t.row - r) < minDist
    );
    if (tooClose) continue;

    grid[r][c].type = TileType.Floor; // Ensure terminal is on floor
    grid[r][c].hasTerminal = true;
    grid[r][c].terminalId = terminals.length;
    terminals.push({ col: c, row: r });
  }

  // Find player start: center-ish floor tile
  let playerStart: Position = { col: Math.floor(GRID_COLS / 2), row: Math.floor(GRID_ROWS / 2) };
  // Ensure it's walkable
  const centerR = Math.floor(GRID_ROWS / 2);
  const centerC = Math.floor(GRID_COLS / 2);
  for (let dr = 0; dr < GRID_ROWS; dr++) {
    for (let dc = 0; dc < GRID_COLS; dc++) {
      const r = (centerR + dr) % GRID_ROWS;
      const c = (centerC + dc) % GRID_COLS;
      if (
        (grid[r][c].type === TileType.Floor || grid[r][c].type === TileType.Unstable) &&
        !grid[r][c].hasTerminal
      ) {
        playerStart = { col: c, row: r };
        grid[r][c].type = TileType.Floor; // Don't start on unstable
        return { grid, playerStart, terminals };
      }
    }
  }

  return { grid, playerStart, terminals };
}

/** Check if a position is walkable */
export function isWalkable(grid: Tile[][], col: number, row: number): boolean {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
  const tile = grid[row][col];
  return tile.type === TileType.Floor || tile.type === TileType.Unstable;
}
