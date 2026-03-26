# Agent Rules

**This is the most important document for any AI agent modifying this repository.**

Read this entire file before making any change. Follow every rule. Complete every checklist.

## Required Reading Before Any Change

Before modifying anything, an agent must read:

| Scope of change | Must read |
|----------------|-----------|
| Adding a new game | This file, [game-contract.md](game-contract.md), [core-boundaries.md](core-boundaries.md), [state-storage.md](state-storage.md), [routing-and-registry.md](routing-and-registry.md) |
| Modifying a game | This file, [game-contract.md](game-contract.md), the game's own files |
| Modifying the shell | This file, [architecture.md](architecture.md), [core-boundaries.md](core-boundaries.md), [routing-and-registry.md](routing-and-registry.md), [error-handling.md](error-handling.md) |
| Modifying styles | This file, [frontend-standards.md](frontend-standards.md), [core-boundaries.md](core-boundaries.md) |
| Anything involving layout/input | This file, [mobile-desktop-guidelines.md](mobile-desktop-guidelines.md) |

## Rules for Adding a New Game

### Step-by-Step

1. Create a new directory: `src/games/<game-id>/`.
2. Create `index.ts` that default-exports a `GameModule` (see [game-contract.md](game-contract.md)).
3. Create `<game-id>.css` with all selectors scoped to `[data-game="<game-id>"]`.
4. Add the game to `src/shell/registry.ts` with a dynamic `import()`.
5. Verify the `id` in the `GameModule` matches the directory name and registry entry.
6. Verify the game implements `mount()` and `unmount()` correctly.
7. Verify no imports cross game boundaries or reach into `src/shell/`.

### What Not to Do When Adding a Game

- Do not modify `index.html`.
- Do not modify any file in `src/shell/` except `registry.ts`.
- Do not modify any file in `src/types/` unless the contract needs to change (requires an ADR).
- Do not modify `src/styles/tokens.css` unless adding a new token that the shell needs (not a game-specific value).
- Do not add global CSS.
- Do not add new dependencies to `package.json` without justification. The platform is vanilla TS — most games need zero dependencies.
- Do not create files outside `src/games/<game-id>/` and `src/shell/registry.ts`.

## Rules for Modifying the Shell

1. The shell must remain game-agnostic. No `if (gameId === '...')` branches.
2. Any change to `SharedServices` or `GameModule` interfaces affects all games. Treat interface changes as breaking changes.
3. Test that existing games still mount/unmount correctly after shell changes.
4. If changing the lifecycle manager, verify all lifecycle event orderings documented in [game-contract.md](game-contract.md) still hold.
5. Record the decision in an ADR if the change alters architectural assumptions.

## Rules for Modifying Styles

1. Shell styles live in `src/styles/`. Game styles live in `src/games/<game-id>/`.
2. Never add unscoped selectors in game CSS.
3. New design tokens go in `tokens.css`. Game-specific magic numbers stay in game CSS files.
4. Do not remove or rename existing tokens without checking all consumers.

## Things an Agent Must Never Do

1. **Never import from one game into another.** This is the most critical isolation rule.
2. **Never access `localStorage`/`sessionStorage` directly.** Always use `services.storage`.
3. **Never modify the DOM outside a game's container.** No touching shell elements.
4. **Never add `window.*` globals.** No ambient state.
5. **Never modify `index.html` for game-specific needs.** `index.html` is shell territory.
6. **Never use `alert()`, `confirm()`, or `prompt()`.**
7. **Never install a framework** (React, Vue, Svelte, etc.) without an ADR.
8. **Never commit a game that doesn't clean up on unmount.** Test the mount→unmount→remount cycle.
9. **Never hard-code absolute asset paths.** Use relative paths or Vite's asset handling.
10. **Never modify another agent's game without explicit instruction.** Each game is its own scope.

## Pre-Edit Checklist

Complete before making changes:

- [ ] I have read the required docs for my scope of change (see table above).
- [ ] I know which files I will create or modify.
- [ ] None of my planned changes violate [core-boundaries.md](core-boundaries.md).
- [ ] If adding a game: I have a unique `id` that is lowercase, URL-safe, and not already in the registry.
- [ ] If modifying the shell: I have confirmed my change is game-agnostic.

## Post-Edit Checklist

Complete before considering work done:

- [ ] The project builds without errors (`npm run build`).
- [ ] The project runs without console errors on the home screen (`npm run dev`).
- [ ] If I added a game: the game appears in the game selector.
- [ ] If I added a game: the game mounts without errors.
- [ ] If I added a game: the game unmounts cleanly (no console warnings, no leaked listeners).
- [ ] If I added a game: I can switch to another game and back without errors.
- [ ] If I added a game: the game works at mobile viewport sizes (320×480 minimum).
- [ ] No new TypeScript errors (`npx tsc --noEmit`).
- [ ] All my CSS selectors are properly scoped.
- [ ] I have not introduced any forbidden patterns from [game-contract.md](game-contract.md).
- [ ] I have not modified files outside my allowed scope.
- [ ] If I changed the shell or types: existing games still work.

## Game Isolation Verification

After adding or modifying a game, verify isolation:

1. Search the game's files for `document.body`, `document.head`, `document.getElementById` — these suggest DOM leakage.
2. Search for `localStorage`, `sessionStorage` — these suggest storage bypass.
3. Search for `import.*from.*games/` — cross-game imports.
4. Search for `import.*from.*shell/` — shell internals access.
5. Search for `window.` assignments — global namespace pollution.
6. Confirm all event listeners added to `window` or `document` are removed in `unmount()`.

## File Scope Summary

```
Allowed to create/modify when adding a game:
  src/games/<game-id>/*          ← all game files
  src/shell/registry.ts          ← add registry entry

Allowed to create/modify when changing the shell:
  src/shell/*
  src/types/*
  src/styles/*
  index.html

Never modify for game-specific reasons:
  index.html
  src/shell/* (except registry.ts)
  src/types/*
  src/styles/tokens.css
  package.json
  vite.config.ts
  tsconfig.json
```
