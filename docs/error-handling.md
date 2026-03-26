# Error Handling

## Principles

1. **A broken game must not break the shell.** The shell must remain navigable even if a game throws during mount, render, or unmount.
2. **Errors are caught at the boundary.** The lifecycle manager wraps all game lifecycle calls in try/catch.
3. **Users see a clear fallback, not a blank screen.**
4. **Developers see actionable details in the console.**

## Failure Isolation

### Mount Failure

If `game.mount()` throws or its returned promise rejects:

1. The shell catches the error.
2. The game container is cleared.
3. A fallback error UI is displayed inside the game viewport.
4. The error is logged to `console.error` with the game ID and stack trace.
5. The shell remains functional — the user can navigate to another game or return home.

### Unmount Failure

If `game.unmount()` throws:

1. The shell catches the error and logs it.
2. The shell forcibly removes the game container from the DOM.
3. Navigation proceeds to the next game or home screen.
4. Dangling listeners or timers from the failed game may leak. This is a known trade-off — the shell cannot clean up what the game failed to release.

### Runtime Errors (After Mount)

Errors that occur during game execution (e.g., inside a `requestAnimationFrame` callback or event handler) are not automatically caught by the shell. Games are responsible for their own error handling during runtime.

The shell should install a global `window.onerror` / `window.addEventListener('unhandledrejection', ...)` handler that:

1. Logs the error with context.
2. Does **not** automatically unmount the game (a single error may not be fatal).
3. Optionally displays a non-blocking error indicator in the shell chrome.

### Pause/Resume Failure

If `pause()` or `resume()` throws:

1. The shell catches and logs the error.
2. The lifecycle continues — a failed pause does not prevent unmount, and a failed resume does not prevent the game from continuing.

## Fallback UI

When a game fails to mount, the shell displays a fallback inside the game viewport:

```html
<div class="shell-error" role="alert">
  <h2>This game failed to load</h2>
  <p>Something went wrong while starting <strong>{game name}</strong>.</p>
  <button data-action="go-home">Back to game list</button>
</div>
```

Requirements:
- The fallback must be styled by the shell, not the game.
- The fallback must include a way to navigate away (back to home).
- The fallback must not expose stack traces to the user in production builds.

## Logging

### Development (Local Vite Dev Server)

- Log all errors with full stack traces to `console.error`.
- Log lifecycle events (`mount`, `unmount`, `pause`, `resume`) to `console.debug` for tracing.
- Log game switches to `console.info`.

Use a simple severity-tagged logger:

```typescript
const log = {
  debug: (...args: unknown[]) => console.debug('[shell]', ...args),
  info: (...args: unknown[]) => console.info('[shell]', ...args),
  error: (...args: unknown[]) => console.error('[shell]', ...args),
};
```

### Production (GitHub Pages)

- Log errors to `console.error` (the browser console is the only available sink).
- Suppress `console.debug` output. Use Vite's `define` or environment variables to gate debug logging.
- Do not send telemetry or call external error-tracking services unless a future ADR adds one.

### Game-Level Logging

Games may log to the console using their own prefix:

```typescript
console.debug('[my-game]', 'Initialized board');
```

Games must not override `console` methods or install global error handlers (the shell owns those).

## What Games Should Do

- Wrap risky operations (network requests, complex state transitions) in try/catch.
- Fail gracefully: show an in-game error message rather than leaving the viewport blank.
- Never swallow errors silently. At minimum, log them.
- Use `AbortController` for fetch requests and abort them in `unmount()`.
