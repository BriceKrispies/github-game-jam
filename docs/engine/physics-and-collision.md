# Physics and Collision

The engine provides simple collision detection and lightweight kinematics. It is not a physics engine. It is a movement-and-overlap system that games use to build their own gameplay physics.

## Design Intent

Most 2D browser games need:

- Things that move (velocity, acceleration).
- Things that detect overlap (did the bullet hit the enemy?).
- Things that block movement (walls, floors).

Most 2D browser games do not need:

- Rigid body dynamics.
- Rotational inertia.
- Joint constraints.
- Continuous collision detection.
- Physics materials with friction and restitution.

The engine provides the first set. The second set is out of scope unless a future ADR explicitly adds it.

## Kinematics: Simple Movement

The engine provides basic kinematic integration. Entities with velocity and acceleration can be updated each tick.

```typescript
// Engine utility — not a full physics step
function integrateMotion(entity: { x: number; y: number; vx: number; vy: number; ax: number; ay: number }, dt: number): void {
  entity.vx += entity.ax * dt;
  entity.vy += entity.ay * dt;
  entity.x += entity.vx * dt;
  entity.y += entity.vy * dt;
}
```

This is a utility function, not an automatic system. Games call it explicitly during their update phase for entities that need movement. The engine does not silently move entities.

### What Belongs in the Engine

- `integrateMotion()` utility.
- Vector2 math helpers (add, subtract, scale, normalize, dot, distance, length).
- Clamping and interpolation utilities.

### What Does Not Belong in the Engine

- Gravity constants (game-specific).
- Drag/friction coefficients (game-specific).
- Jump curves, dash mechanics, knockback (game logic).
- Pathfinding (game logic or a game-level library).

## Collision Detection

The engine detects overlaps between geometric primitives. It reports what overlaps what. It does not decide what happens — that is game logic.

### Supported Primitives

| Primitive | Definition |
|-----------|------------|
| AABB | Axis-aligned bounding box: `{ x, y, width, height }` where (x, y) is the top-left corner |
| Circle | `{ cx, cy, radius }` |
| Point | `{ x, y }` |

### Supported Tests

| Test | Returns |
|------|---------|
| AABB vs AABB | `boolean` — do they overlap? |
| Circle vs Circle | `boolean` |
| AABB vs Circle | `boolean` |
| Point in AABB | `boolean` |
| Point in Circle | `boolean` |
| AABB vs AABB overlap | `{ overlapX, overlapY }` — minimum translation vector to separate |
| Raycast vs AABB | `{ hit: boolean, t: number, normal: Vector2 }` |

These are pure functions. They take geometry in, return results out. They do not reference entities, scenes, or any engine state.

```typescript
// Pure collision test — no side effects
function testAABBvsAABB(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}
```

### Collision System

The collision subsystem operates on entities in the world. Each frame (during the update phase, after movement), the collision system:

1. Gathers all entities with collision bounds.
2. Tests pairs for overlap.
3. Reports collision pairs to game code via callbacks or a query API.

```typescript
interface CollisionSystem {
  /** Check all entity pairs and report overlaps. */
  detectAll(entities: Entity[]): CollisionPair[];

  /** Check a single entity against all others. */
  detectFor(entity: Entity, others: Entity[]): CollisionPair[];

  /** Test two specific bounds. */
  test(a: CollisionBounds, b: CollisionBounds): boolean;

  /** Get the overlap vector between two AABBs. */
  overlap(a: AABB, b: AABB): { overlapX: number; overlapY: number } | null;
}

interface CollisionPair {
  entityA: Entity;
  entityB: Entity;
  overlapX: number;
  overlapY: number;
}
```

### Broad Phase

For games with few entities (under 100), brute-force pair testing is sufficient. The engine starts with brute-force.

If performance becomes a problem, a spatial partitioning structure (grid, quadtree) can be added behind the `CollisionSystem` interface without changing game code. This optimization is deferred until a concrete need arises. Do not add spatial partitioning preemptively.

## Collision Detection vs Collision Response

This is the most important conceptual separation in this subsystem.

**Detection** (engine responsibility): "Entity A and Entity B are overlapping by (4px, 2px)."

**Response** (game responsibility): "Push them apart," "Destroy the bullet," "Deal 10 damage," "Play a sound," "Ignore it because they're on the same team."

The engine never decides what happens when things collide. It only reports that they did.

```typescript
// ALLOWED: Game handles response
const pairs = engine.collision.detectAll(entities);
for (const { entityA, entityB, overlapX, overlapY } of pairs) {
  if (isPlayer(entityA) && isEnemy(entityB)) {
    takeDamage(entityA, 10);
  }
  if (isPlayer(entityA) && isWall(entityB)) {
    entityA.x -= overlapX;
    entityA.y -= overlapY;
  }
}

// FORBIDDEN: Engine auto-resolves collisions
// The engine must never push entities apart, deal damage, or trigger game events.
```

## Triggers and Overlaps

A trigger is a collision region that detects entry, stay, and exit without physical response. Triggers are useful for:

- Entering a zone (checkpoint, damage area, dialogue trigger).
- Detecting proximity (aggro range, pickup radius).

The engine provides trigger state tracking:

```typescript
interface TriggerEvent {
  entityA: Entity;
  entityB: Entity;
  type: 'enter' | 'stay' | 'exit';
}
```

- **enter**: A and B overlapped this frame but did not overlap last frame.
- **stay**: A and B overlapped this frame and also overlapped last frame.
- **exit**: A and B did not overlap this frame but did overlap last frame.

The engine tracks previous-frame overlap state to generate these events. Games register callbacks or query trigger events during their update phase.

## Fixed Timestep

Collision detection runs during the fixed-timestep update, not during the render phase. This ensures deterministic behavior regardless of frame rate.

The update loop:

```
accumulator += frameDeltaTime
while (accumulator >= FIXED_DT):
    processInput()
    updateEntities(FIXED_DT)      ← movement happens here
    detectCollisions()             ← collision detection happens here
    handleCollisionResponse()      ← game code handles results
    accumulator -= FIXED_DT
```

`FIXED_DT` should default to `1/60` (60 ticks per second). Games may configure this if they need a different tick rate. The value must be consistent within a game session.

### Why Fixed Timestep Matters for Collision

Variable-timestep collision is unreliable. A large delta time can cause entities to tunnel through thin walls. Fixed timestep keeps per-tick movement small and predictable, making simple overlap detection sufficient for most games.

## What Is Intentionally Deferred

| Feature | Status | Rationale |
|---------|--------|-----------|
| Continuous collision detection (CCD) | Deferred | Adds complexity. Fixed timestep with small dt mitigates tunneling for most games. |
| Rigid body dynamics | Deferred | Not needed for typical 2D browser games. |
| Joints and constraints | Deferred | Physics engine territory. |
| Physics materials (friction, restitution, density) | Deferred | Response is game logic. The engine doesn't need material properties. |
| Rotational physics (torque, angular velocity) | Deferred | Most 2D games use visual rotation without physics rotation. |
| Spatial partitioning (quadtree, grid) | Deferred | Optimization for high entity counts. Add when needed, behind the existing interface. |
| Polygon collision | Deferred | AABB and circle cover most 2D game needs. Polygon support is a significant complexity increase. |

Any deferred feature requires an ADR before implementation. "Deferred" does not mean "planned." It means "explicitly not now, and possibly never."

## Extension Points

When a game needs collision behavior beyond what the engine provides:

1. The game implements it as game-level code, not engine code.
2. The game may use the engine's primitive tests (`testAABBvsAABB`, etc.) as building blocks.
3. If the same need arises in multiple games, consider promoting it to the engine via an ADR.

```typescript
// ALLOWED: Game builds custom collision logic using engine primitives
function checkLineOfSight(from: Vector2, to: Vector2, walls: AABB[]): boolean {
  for (const wall of walls) {
    const hit = engine.collision.raycastAABB(from, to, wall);
    if (hit.hit) return false;
  }
  return true;
}
```
