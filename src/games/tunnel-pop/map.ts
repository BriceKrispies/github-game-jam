import { COLS, ROWS } from './config';
import { Tile } from './types';

export function generateMap(): Tile[][] {
  const grid: Tile[][] = [];

  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        grid[r][c] = Tile.Rock;
      } else if (r <= 2) {
        // Surface tunnel (player start area)
        grid[r][c] = Tile.Tunnel;
      } else {
        grid[r][c] = Tile.Dirt;
      }
    }
  }

  // Structural rock pillars for interesting dig paths
  const rocks: [number, number][] = [
    [4, 4], [8, 4],
    [6, 6],
    [3, 8], [10, 8],
    [6, 10],
    [4, 12], [9, 12],
  ];
  for (const [c, r] of rocks) {
    if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
      grid[r][c] = Tile.Rock;
    }
  }

  return grid;
}

export function canWalk(grid: Tile[][], col: number, row: number): boolean {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
  return grid[row][col] === Tile.Tunnel;
}

export function canDig(grid: Tile[][], col: number, row: number): boolean {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
  return grid[row][col] === Tile.Dirt;
}

export function isPassable(grid: Tile[][], col: number, row: number, ghost: boolean): boolean {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
  const tile = grid[row][col];
  if (tile === Tile.Rock) return false;
  if (ghost) return true;
  return tile === Tile.Tunnel;
}
