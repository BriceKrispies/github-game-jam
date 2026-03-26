export enum TileType {
  Floor = 0,
  Wall = 1,
  Unstable = 2,
  Collapsed = 3,
}

export interface Tile {
  type: TileType;
  stepsOnIt: number;       // For unstable tiles: how many times stepped on
  collapseTimer: number;   // Countdown in ms before collapse (0 = not collapsing)
  hasTerminal: boolean;    // Pickup/delivery point
  terminalId: number;      // Which terminal this is (-1 if none)
}

export interface Position {
  col: number;
  row: number;
}

export interface Package {
  id: number;
  pickup: Position;
  delivery: Position;
  pickedUp: boolean;
}

export interface PlayerState {
  pos: Position;
  prevPos: Position;
  moveProgress: number;    // 0..1 for interpolation
  moving: boolean;
  carryingPackage: Package | null;
  energy: number;
  alive: boolean;
}

export interface GameState {
  grid: Tile[][];
  player: PlayerState;
  packages: Package[];
  score: number;
  combo: number;
  deliveries: number;
  collapseWave: number;
  collapseTimer: number;
  nextPackageId: number;
  terminalPositions: Position[];
  gameOver: boolean;
  gameOverReason: string;
  started: boolean;
  elapsed: number;
  deliveryFlash: number;  // Countdown timer for delivery feedback (ms)
}

export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}
