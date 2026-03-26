# Tunnel Pop

A Dig Dug-inspired arcade game. Carve tunnels through packed earth, corner enemies, and pop them before they get you.

## Gameplay Loop

1. **Dig** — move into dirt tiles to carve tunnels and score points
2. **Evade** — enemies patrol tunnels and chase you; avoid contact
3. **Attack** — fire a beam in your facing direction to inflate enemies
4. **Pop** — 3 hits inflates an enemy until it pops (defeated)
5. **Survive** — clear all enemies to advance to the next round

## Map Structure

- 13x15 tile grid
- Border of indestructible rock
- Top 2 rows: pre-dug surface tunnels (player start area)
- Below: packed dirt with scattered rock pillars
- Enemies spawn embedded in the dirt at predefined positions
- Dirt has 4 color layers by depth for visual stratification

## Enemy Behavior

- Enemies follow tunnels, biased toward chasing the player (65/35 chase/random)
- Avoid reversing direction unless it's the only option
- **Ghost mode**: every 5-9 seconds, an enemy can phase through dirt for 3 seconds, moving directly toward the player
- Ghost enemies are visually transparent
- Inflated enemies are stunned and cannot move
- If not hit again within 1.8s, enemies deflate one stage

## Attack Rules

- Player fires a beam in the facing direction (space / X / POP button)
- Beam travels through tunnel tiles only, stops at dirt/rock
- Range: 3 tiles
- Hitting an enemy inflates it one stage (3 stages to pop)
- Cooldown: 350ms between attacks
- Beam is visible for 200ms with glow effect

## Input

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | Arrow keys / WASD | D-pad (bottom-left) |
| Attack | Space / X | POP button (bottom-right) |
| Restart | Space / Enter | Tap anywhere |

## Scoring

| Action | Points |
|--------|--------|
| Dig a tile | 10 |
| Pop 1st enemy | 200 |
| Pop 2nd enemy | 400 |
| Pop 3rd enemy | 600 |
| Clear round | 500 |

Enemy pop scores double cumulatively within each round.

## Tuning

All values in `src/games/tunnel-pop/config.ts`:

| Value | Default | Effect |
|---|---|---|
| `PLAYER_SPEED` | 90ms | Player movement speed per tile |
| `ENEMY_SPEED` | 150ms | Enemy movement speed per tile |
| `ENEMY_GHOST_SPEED` | 190ms | Ghost mode movement speed |
| `ATTACK_RANGE` | 3 | Beam range in tiles |
| `ATTACK_COOLDOWN_MS` | 350 | Time between attacks |
| `INFLATE_MAX` | 3 | Hits to pop an enemy |
| `DEFLATE_MS` | 1800 | Time before enemy deflates one stage |
| `GHOST_COOLDOWN_MIN/MAX` | 5000-9000 | Range for ghost mode cooldown |
| `GHOST_DURATION` | 3000 | How long ghost mode lasts |
| `ENEMIES_START` | 4 | Enemies in round 1 |
| `ENEMIES_PER_ROUND` | 1 | Additional enemies per round |
| `ENEMIES_CAP` | 8 | Maximum enemies |
| `LIVES` | 3 | Starting lives |

## Shell Boundary

- Game is fully self-contained under `src/games/tunnel-pop/`
- Uses `SharedServices.storage` for high score persistence (namespaced)
- Uses `SharedServices.viewport` for resize events
- No shell code modified except registry entry

## Structure

```
src/games/tunnel-pop/
  config.ts      — grid size, speeds, colors, tuning values
  types.ts       — Tile, Dir, Pos, Player, Enemy, State interfaces
  map.ts         — map generation, walkability checks
  effects.ts     — particle system, score popups, screen shake
  state.ts       — game logic (movement, AI, attack, collision, rounds)
  renderer.ts    — Canvas 2D rendering
  input.ts       — keyboard + mobile d-pad + attack button
  hud.ts         — score, round, lives overlay
  tunnel-pop.css — scoped styles
  index.ts       — GameModule entry point
```
