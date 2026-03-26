export enum Tile { Tunnel, Dirt, Rock }

export enum Dir { Up, Down, Left, Right }

export interface Pos { col: number; row: number }

export interface Player {
  pos: Pos;
  prev: Pos;
  t: number;          // move interpolation 0..1
  moving: boolean;
  facing: Dir;
  alive: boolean;
  respawnTimer: number;
  invulnTimer: number;
}

export interface Enemy {
  id: number;
  pos: Pos;
  prev: Pos;
  t: number;
  moving: boolean;
  dir: Dir;
  inflate: number;    // 0 = normal, 1-2 = inflated, 3 = popped
  deflateTimer: number;
  ghost: boolean;
  ghostTimer: number;  // cooldown until next ghost (or remaining ghost time if ghost=true)
  alive: boolean;
  speed: number;       // ms per tile
}

export interface Beam {
  tiles: Pos[];        // path the beam covers
  timer: number;       // ms remaining
  hitEnemy: boolean;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;        // 0..1 remaining
  decay: number;       // life lost per second
  color: string;
  size: number;
}

export interface Popup {
  x: number; y: number;
  text: string;
  life: number;
}

export interface Effects {
  particles: Particle[];
  popups: Popup[];
  shake: number;
}

export interface State {
  grid: Tile[][];
  player: Player;
  enemies: Enemy[];
  beam: Beam | null;
  attackCooldown: number;
  effects: Effects;
  score: number;
  lives: number;
  round: number;
  roundDelay: number;   // countdown before next round starts
  phase: 'playing' | 'roundClear' | 'gameOver';
  elapsed: number;
  heldDir: Dir | null;
  popsThisRound: number;
}
