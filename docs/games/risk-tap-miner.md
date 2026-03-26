# Risk Tap Miner

A push-your-luck tapping game. Tap to mine deeper, cash out before the mine collapses.

## Gameplay Loop

1. **Tap** the screen to mine one level deeper. Each tap earns score.
2. **Risk increases** with every tap — the deeper you go, the higher the chance of collapse.
3. **Cash out** at any time to bank your run score safely.
4. If the mine **collapses**, your run score is lost.
5. New run starts immediately. No friction between attempts.

Runs last 5–20 seconds. The tension is between "one more tap" and "cash out now."

## Tuning Knobs

All tuning values live in `src/games/risk-tap-miner/config.ts`:

| Value | Default | Effect |
|---|---|---|
| `BASE_SCORE_PER_TAP` | 10 | Points earned on first tap |
| `SCORE_GROWTH` | 1.12 | Multiplier per depth level (exponential) |
| `BASE_HAZARD_CHANCE` | 0.02 | Starting collapse probability (2%) |
| `HAZARD_GROWTH_PER_TAP` | 0.018 | Probability increase per tap (+1.8%) |
| `HAZARD_ACCEL_DEPTH` | 15 | Depth after which hazard growth accelerates |
| `HAZARD_ACCEL_FACTOR` | 1.6 | Acceleration multiplier past accel depth |
| `FAIL_DISPLAY_MS` | 1200 | How long failure state shows before auto-reset |
| `CASHOUT_DISPLAY_MS` | 800 | How long cashout celebration shows |
| `MAX_DEPTH_VISUAL` | 40 | Depth at which visual intensity maxes out |

### Adjusting feel

- **Easier early game**: Lower `BASE_HAZARD_CHANCE` or `HAZARD_GROWTH_PER_TAP`
- **Faster escalation**: Raise `HAZARD_GROWTH_PER_TAP` or lower `HAZARD_ACCEL_DEPTH`
- **Higher score ceiling**: Raise `SCORE_GROWTH` (compounds exponentially)
- **Snappier restarts**: Lower `FAIL_DISPLAY_MS`

## Input

- **Mobile**: Tap anywhere to mine. Cash Out button at bottom.
- **Desktop**: Click to mine. Space to mine. Enter to cash out.

## Visual feedback

- Background gradient shifts from light to dark as depth increases
- Tap ripples expand from touch point with floating +score numbers
- Thin risk bar below HUD fills and changes color (blue → amber → red)
- Screen shake on collapse
- Green flash on cash out
- Red flash on failure

## Structure

```
src/games/risk-tap-miner/
  config.ts          — tuning values and color palette
  types.ts           — GameState and Ripple interfaces
  state.ts           — tap/cashOut/update logic, hazard roll
  renderer.ts        — Canvas 2D drawing (background, depth, ripples, results)
  ui.ts              — DOM HUD overlay + cash out button
  risk-tap-miner.css — scoped styles
  index.ts           — GameModule entry point
```

## Persistence

- `bankedScore` and `bestRun` are saved via shell GameStorage (namespaced).
- Scores persist across sessions.
