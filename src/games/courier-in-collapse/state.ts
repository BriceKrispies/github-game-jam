import {
  STARTING_ENERGY,
  ENERGY_PER_MOVE,
  ENERGY_PER_DELIVERY,
  SCORE_PER_DELIVERY,
  SCORE_COMBO_BONUS,
  MAX_PACKAGES,
  UNSTABLE_STEPS_BEFORE_COLLAPSE,
  COLLAPSE_INTERVAL_MS,
  COLLAPSE_WARN_MS,
  MOVE_DURATION_MS,
} from './config';
import {
  TileType,
  Direction,
  type GameState,
  type Position,
  type Package,
} from './types';
import { generateWorld, isWalkable } from './world';

export function createInitialState(): GameState {
  const { grid, playerStart, terminals } = generateWorld();

  const state: GameState = {
    grid,
    player: {
      pos: { ...playerStart },
      prevPos: { ...playerStart },
      moveProgress: 1,
      moving: false,
      carryingPackage: null,
      energy: STARTING_ENERGY,
      alive: true,
    },
    packages: [],
    score: 0,
    combo: 0,
    deliveries: 0,
    collapseWave: 0,
    collapseTimer: COLLAPSE_INTERVAL_MS,
    nextPackageId: 1,
    terminalPositions: terminals,
    gameOver: false,
    gameOverReason: '',
    started: false,
    elapsed: 0,
    deliveryFlash: 0,
  };

  // Spawn initial packages
  spawnPackages(state);

  return state;
}

export function tryMove(state: GameState, dir: Direction): boolean {
  if (state.gameOver || state.player.moving) return false;

  const { col, row } = state.player.pos;
  let nc = col;
  let nr = row;

  switch (dir) {
    case Direction.Up: nr--; break;
    case Direction.Down: nr++; break;
    case Direction.Left: nc--; break;
    case Direction.Right: nc++; break;
  }

  if (!isWalkable(state.grid, nc, nr)) return false;

  state.player.prevPos = { ...state.player.pos };
  state.player.pos = { col: nc, row: nr };
  state.player.moveProgress = 0;
  state.player.moving = true;
  state.player.energy = Math.max(0, state.player.energy - ENERGY_PER_MOVE);
  state.started = true;

  // Handle unstable tiles
  const tile = state.grid[nr][nc];
  if (tile.type === TileType.Unstable) {
    tile.stepsOnIt++;
    if (tile.stepsOnIt >= UNSTABLE_STEPS_BEFORE_COLLAPSE) {
      tile.collapseTimer = COLLAPSE_WARN_MS;
    }
  }

  return true;
}

export function update(state: GameState, dt: number): void {
  if (state.gameOver) return;

  const dtMs = dt * 1000;
  state.elapsed += dtMs;

  // Tick delivery flash
  if (state.deliveryFlash > 0) {
    state.deliveryFlash = Math.max(0, state.deliveryFlash - dtMs);
  }

  // Update movement interpolation
  if (state.player.moving) {
    state.player.moveProgress += dt / (MOVE_DURATION_MS / 1000);
    if (state.player.moveProgress >= 1) {
      state.player.moveProgress = 1;
      state.player.moving = false;
      onArrived(state);
    }
  }

  // Update collapse timers on tiles
  for (let r = 0; r < state.grid.length; r++) {
    for (let c = 0; c < state.grid[r].length; c++) {
      const tile = state.grid[r][c];
      if (tile.collapseTimer > 0) {
        tile.collapseTimer -= dtMs;
        if (tile.collapseTimer <= 0) {
          tile.collapseTimer = 0;
          tile.type = TileType.Collapsed;
          tile.hasTerminal = false;
          // Kill player if standing here
          if (state.player.pos.col === c && state.player.pos.row === r && !state.player.moving) {
            endGame(state, 'The ground collapsed beneath you!');
          }
          // Destroy package if here
          state.packages = state.packages.filter(
            (p) => !(p.pickup.col === c && p.pickup.row === r && !p.pickedUp) &&
                   !(p.delivery.col === c && p.delivery.row === r)
          );
        }
      }
    }
  }

  // Collapse wave timer
  if (state.started) {
    state.collapseTimer -= dtMs;
    if (state.collapseTimer <= 0) {
      triggerCollapseWave(state);
      state.collapseWave++;
      state.collapseTimer = Math.max(1500, COLLAPSE_INTERVAL_MS - state.collapseWave * 200);
    }
  }

  // Check energy death
  if (state.player.energy <= 0 && !state.player.moving) {
    endGame(state, 'You ran out of energy!');
  }

  // Ensure packages exist
  spawnPackages(state);
}

function onArrived(state: GameState): void {
  const { col, row } = state.player.pos;
  const tile = state.grid[row][col];

  // Check if standing on a package pickup
  if (!state.player.carryingPackage) {
    const pkg = state.packages.find(
      (p) => !p.pickedUp && p.pickup.col === col && p.pickup.row === row
    );
    if (pkg) {
      pkg.pickedUp = true;
      state.player.carryingPackage = pkg;
    }
  }

  // Check if delivering
  if (state.player.carryingPackage) {
    const pkg = state.player.carryingPackage;
    if (pkg.delivery.col === col && pkg.delivery.row === row && tile.hasTerminal) {
      // Delivery success!
      state.combo++;
      state.deliveries++;
      state.score += SCORE_PER_DELIVERY + SCORE_COMBO_BONUS * (state.combo - 1);
      state.player.energy = Math.min(STARTING_ENERGY, state.player.energy + ENERGY_PER_DELIVERY);
      state.packages = state.packages.filter((p) => p.id !== pkg.id);
      state.player.carryingPackage = null;
      state.deliveryFlash = 400;
    }
  }
}

function triggerCollapseWave(state: GameState): void {
  // Pick random unstable/floor tiles to start collapsing
  const candidates: Position[] = [];
  for (let r = 1; r < state.grid.length - 1; r++) {
    for (let c = 1; c < state.grid[r].length - 1; c++) {
      const tile = state.grid[r][c];
      if (tile.type === TileType.Floor && !tile.hasTerminal && tile.collapseTimer === 0) {
        // Check if adjacent to a collapsed tile (collapse spreads)
        const adjCollapsed = [
          [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
        ].some(([ar, ac]) => {
          if (ar < 0 || ar >= state.grid.length || ac < 0 || ac >= state.grid[0].length) return false;
          return state.grid[ar][ac].type === TileType.Collapsed;
        });
        if (adjCollapsed) candidates.push({ col: c, row: r });
      }
      if (tile.type === TileType.Unstable && tile.collapseTimer === 0) {
        candidates.push({ col: c, row: r });
      }
    }
  }

  // Collapse 1-3 tiles per wave
  const count = Math.min(candidates.length, 1 + Math.floor(state.collapseWave * 0.5));
  shuffle(candidates);
  for (let i = 0; i < count && i < candidates.length; i++) {
    const { col, row } = candidates[i];
    const tile = state.grid[row][col];
    if (tile.type === TileType.Floor) {
      tile.type = TileType.Unstable;
    } else {
      tile.collapseTimer = COLLAPSE_WARN_MS;
    }
  }
}

function spawnPackages(state: GameState): void {
  const activeCount = state.packages.length;
  if (activeCount >= MAX_PACKAGES) return;

  // Find available terminals (not collapsed, not occupied by existing package endpoints)
  const usedTerminals = new Set<number>();
  for (const pkg of state.packages) {
    const pickupTile = state.grid[pkg.pickup.row]?.[pkg.pickup.col];
    if (pickupTile) usedTerminals.add(pickupTile.terminalId);
    const deliveryTile = state.grid[pkg.delivery.row]?.[pkg.delivery.col];
    if (deliveryTile) usedTerminals.add(deliveryTile.terminalId);
  }

  const available = state.terminalPositions.filter((t, i) => {
    const tile = state.grid[t.row]?.[t.col];
    return tile && tile.hasTerminal && !usedTerminals.has(i);
  });

  while (state.packages.length < MAX_PACKAGES && available.length >= 2) {
    const pickupIdx = Math.floor(Math.random() * available.length);
    const pickup = available.splice(pickupIdx, 1)[0];
    const deliveryIdx = Math.floor(Math.random() * available.length);
    const delivery = available.splice(deliveryIdx, 1)[0];

    state.packages.push({
      id: state.nextPackageId++,
      pickup,
      delivery,
      pickedUp: false,
    });
  }
}

function endGame(state: GameState, reason: string): void {
  state.gameOver = true;
  state.gameOverReason = reason;
  state.player.alive = false;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
