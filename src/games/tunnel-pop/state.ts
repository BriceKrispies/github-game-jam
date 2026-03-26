import {
  COLS, ROWS, PLAYER_SPEED, ENEMY_SPEED, ENEMY_GHOST_SPEED,
  ATTACK_RANGE, ATTACK_FLASH_MS, ATTACK_COOLDOWN_MS,
  INFLATE_MAX, DEFLATE_MS,
  GHOST_COOLDOWN_MIN, GHOST_COOLDOWN_MAX, GHOST_DURATION,
  LIVES, RESPAWN_MS, INVULN_MS,
  ENEMIES_START, ENEMIES_PER_ROUND, ENEMIES_CAP, ROUND_DELAY_MS,
  PTS_DIG, PTS_POP_BASE,
  SPAWN_POSITIONS, PLAYER_START, C,
} from './config';
import { Tile, Dir, type Pos, type State, type Enemy } from './types';
import { generateMap, isPassable, canDig } from './map';
import { createEffects, spawnDigParticles, spawnPopParticles, spawnPopup, updateEffects } from './effects';

// ── Helpers ──

function applyDir(pos: Pos, dir: Dir): Pos {
  switch (dir) {
    case Dir.Up: return { col: pos.col, row: pos.row - 1 };
    case Dir.Down: return { col: pos.col, row: pos.row + 1 };
    case Dir.Left: return { col: pos.col - 1, row: pos.row };
    case Dir.Right: return { col: pos.col + 1, row: pos.row };
  }
}

function opposite(d: Dir): Dir {
  switch (d) {
    case Dir.Up: return Dir.Down;
    case Dir.Down: return Dir.Up;
    case Dir.Left: return Dir.Right;
    case Dir.Right: return Dir.Left;
  }
}

function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

function samePos(a: Pos, b: Pos): boolean {
  return a.col === b.col && a.row === b.row;
}

function ghostCooldown(): number {
  return GHOST_COOLDOWN_MIN + Math.random() * (GHOST_COOLDOWN_MAX - GHOST_COOLDOWN_MIN);
}

function dirtColor(row: number): string {
  // Approximate dirt color for particles
  if (row <= 5) return '#c4956a';
  if (row <= 8) return '#a87450';
  if (row <= 11) return '#8c5b38';
  return '#6a3e24';
}

// ── State creation ──

export function createState(): State {
  const grid = generateMap();
  const [pc, pr] = PLAYER_START;

  const state: State = {
    grid,
    player: {
      pos: { col: pc, row: pr },
      prev: { col: pc, row: pr },
      t: 1,
      moving: false,
      facing: Dir.Right,
      alive: true,
      respawnTimer: 0,
      invulnTimer: 0,
    },
    enemies: [],
    beam: null,
    attackCooldown: 0,
    effects: createEffects(),
    score: 0,
    lives: LIVES,
    round: 1,
    roundDelay: 0,
    phase: 'playing',
    elapsed: 0,
    heldDir: null,
    popsThisRound: 0,
  };

  spawnEnemies(state);
  return state;
}

function spawnEnemies(state: State): void {
  const count = Math.min(ENEMIES_START + (state.round - 1) * ENEMIES_PER_ROUND, ENEMIES_CAP);
  const speedMult = Math.max(0.7, 1 - (state.round - 1) * 0.04);

  for (let i = 0; i < count && i < SPAWN_POSITIONS.length; i++) {
    const [c, r] = SPAWN_POSITIONS[i];
    state.enemies.push({
      id: i,
      pos: { col: c, row: r },
      prev: { col: c, row: r },
      t: 1,
      moving: false,
      dir: Dir.Up,
      inflate: 0,
      deflateTimer: 0,
      ghost: false,
      ghostTimer: ghostCooldown(),
      alive: true,
      speed: Math.round(ENEMY_SPEED * speedMult),
    });
  }
}

// ── Player movement ──

export function setDirection(state: State, dir: Dir | null): void {
  state.heldDir = dir;
}

export function tryAttack(state: State): void {
  if (state.attackCooldown > 0 || state.beam || !state.player.alive) return;
  if (state.phase !== 'playing') return;

  const { pos, facing } = state.player;
  const tiles: Pos[] = [];
  let hitEnemy = false;

  let checkPos = pos;
  for (let i = 1; i <= ATTACK_RANGE; i++) {
    checkPos = applyDir(checkPos, facing);

    if (checkPos.row <= 0 || checkPos.row >= ROWS - 1 || checkPos.col <= 0 || checkPos.col >= COLS - 1) break;
    const tile = state.grid[checkPos.row][checkPos.col];
    if (tile === Tile.Rock || tile === Tile.Dirt) break;

    tiles.push({ ...checkPos });

    // Check for enemy hit
    const enemy = state.enemies.find(e => e.alive && samePos(e.pos, checkPos));
    if (enemy) {
      hitEnemy = true;
      inflateEnemy(state, enemy);
      break;
    }
  }

  state.beam = { tiles, timer: ATTACK_FLASH_MS, hitEnemy };
  state.attackCooldown = ATTACK_COOLDOWN_MS;
}

function inflateEnemy(state: State, enemy: Enemy): void {
  enemy.inflate++;
  enemy.deflateTimer = DEFLATE_MS;

  if (enemy.inflate >= INFLATE_MAX) {
    enemy.alive = false;
    state.popsThisRound++;
    const pts = PTS_POP_BASE * state.popsThisRound;
    state.score += pts;
    spawnPopParticles(state.effects, enemy.pos, C.enemy);
    spawnPopup(state.effects, enemy.pos, `+${pts}`);
  }
}

// ── Main update ──

export function update(state: State, dt: number): void {
  state.elapsed += dt * 1000;

  updateEffects(state.effects, dt);

  // Beam timer
  if (state.beam) {
    state.beam.timer -= dt * 1000;
    if (state.beam.timer <= 0) state.beam = null;
  }
  if (state.attackCooldown > 0) state.attackCooldown -= dt * 1000;

  if (state.phase === 'gameOver') return;

  if (state.phase === 'roundClear') {
    state.roundDelay -= dt * 1000;
    if (state.roundDelay <= 0) {
      state.round++;
      state.popsThisRound = 0;
      spawnEnemies(state);
      state.phase = 'playing';
    }
    return;
  }

  // Respawn
  if (!state.player.alive) {
    state.player.respawnTimer -= dt * 1000;
    if (state.player.respawnTimer <= 0) {
      respawnPlayer(state);
    }
    return;
  }

  // Invulnerability
  if (state.player.invulnTimer > 0) {
    state.player.invulnTimer -= dt * 1000;
  }

  // Player movement
  updatePlayerMovement(state, dt);

  // Enemy updates
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    updateEnemy(state, enemy, dt);
  }

  // Collision
  checkCollisions(state);

  // Round clear check
  if (state.enemies.every(e => !e.alive)) {
    state.score += 500;
    state.phase = 'roundClear';
    state.roundDelay = ROUND_DELAY_MS;
    spawnPopup(state.effects, state.player.pos, '+500');
  }
}

function updatePlayerMovement(state: State, dt: number): void {
  const p = state.player;

  if (p.moving) {
    p.t += dt / (PLAYER_SPEED / 1000);
    if (p.t >= 1) {
      p.t = 1;
      p.moving = false;
    }
  }

  if (!p.moving && state.heldDir !== null) {
    const dir = state.heldDir;
    p.facing = dir;
    const next = applyDir(p.pos, dir);

    if (next.row > 0 && next.row < ROWS - 1 && next.col > 0 && next.col < COLS - 1) {
      const tile = state.grid[next.row][next.col];

      if (tile === Tile.Tunnel) {
        startPlayerMove(p, next);
      } else if (tile === Tile.Dirt) {
        // Dig!
        state.grid[next.row][next.col] = Tile.Tunnel;
        state.score += PTS_DIG;
        spawnDigParticles(state.effects, next, dirtColor(next.row));
        startPlayerMove(p, next);
      }
      // Rock: can't move
    }
  }
}

function startPlayerMove(p: State['player'], next: Pos): void {
  p.prev = { ...p.pos };
  p.pos = next;
  p.t = 0;
  p.moving = true;
}

function updateEnemy(state: State, enemy: Enemy, dt: number): void {
  // Deflate timer
  if (enemy.inflate > 0) {
    enemy.deflateTimer -= dt * 1000;
    if (enemy.deflateTimer <= 0) {
      enemy.inflate--;
      enemy.deflateTimer = DEFLATE_MS;
    }
    return; // Stunned while inflated
  }

  // Ghost timer
  if (enemy.ghost) {
    enemy.ghostTimer -= dt * 1000;
    if (enemy.ghostTimer <= 0) {
      enemy.ghost = false;
      enemy.ghostTimer = ghostCooldown();
      // If ended ghost mode inside dirt, keep going until we hit a tunnel
    }
  } else {
    enemy.ghostTimer -= dt * 1000;
    if (enemy.ghostTimer <= 0) {
      enemy.ghost = true;
      enemy.ghostTimer = GHOST_DURATION;
    }
  }

  // Movement interpolation
  if (enemy.moving) {
    const spd = enemy.ghost ? ENEMY_GHOST_SPEED : enemy.speed;
    enemy.t += dt / (spd / 1000);
    if (enemy.t >= 1) {
      enemy.t = 1;
      enemy.moving = false;
    }
  }

  // Choose next move
  if (!enemy.moving) {
    const dir = chooseEnemyDir(state, enemy);
    if (dir !== null) {
      const next = applyDir(enemy.pos, dir);
      enemy.prev = { ...enemy.pos };
      enemy.pos = next;
      enemy.dir = dir;
      enemy.t = 0;
      enemy.moving = true;
    }
  }
}

function chooseEnemyDir(state: State, enemy: Enemy): Dir | null {
  const pos = enemy.pos;
  const target = state.player.pos;

  const dirs = [Dir.Up, Dir.Down, Dir.Left, Dir.Right];
  const options: { dir: Dir; pos: Pos; dist: number }[] = [];

  for (const d of dirs) {
    const np = applyDir(pos, d);
    if (!isPassable(state.grid, np.col, np.row, enemy.ghost)) continue;
    options.push({ dir: d, pos: np, dist: manhattan(np, target) });
  }

  if (options.length === 0) return null;

  // Avoid reversing unless only option
  const nonReverse = options.filter(o => o.dir !== opposite(enemy.dir));
  const candidates = nonReverse.length > 0 ? nonReverse : options;

  candidates.sort((a, b) => a.dist - b.dist);

  // 65% chase, 35% random
  if (Math.random() < 0.65) {
    return candidates[0].dir;
  }
  return candidates[Math.floor(Math.random() * candidates.length)].dir;
}

function checkCollisions(state: State): void {
  if (!state.player.alive || state.player.invulnTimer > 0) return;

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.inflate > 0) continue;
    if (samePos(state.player.pos, enemy.pos)) {
      killPlayer(state);
      return;
    }
  }
}

function killPlayer(state: State): void {
  state.player.alive = false;
  state.lives--;
  state.effects.shake = 350;
  spawnPopParticles(state.effects, state.player.pos, C.player);

  if (state.lives <= 0) {
    state.phase = 'gameOver';
  } else {
    state.player.respawnTimer = RESPAWN_MS;
  }
}

function respawnPlayer(state: State): void {
  const [c, r] = PLAYER_START;
  // Ensure start area is tunnel
  state.grid[r][c] = Tile.Tunnel;
  state.player.pos = { col: c, row: r };
  state.player.prev = { col: c, row: r };
  state.player.t = 1;
  state.player.moving = false;
  state.player.alive = true;
  state.player.invulnTimer = INVULN_MS;
}

export function restartGame(state: State): void {
  const fresh = createState();
  Object.assign(state, fresh);
}
