# Chronos

Minimal focus timer for macOS. Open-source Session app alternative.

## Stack

| Layer | Choice |
|-------|--------|
| Shell | Electron 35 |
| Build | electron-vite 3 |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4 (CSS-first, no config file) |
| Linting | Biome (NOT ESLint/Prettier) |
| Storage | JSON at `~/.chronos/sessions.json` |
| Font | JetBrains Mono (bundled) |
| Package manager | bun |

## Commands

```bash
bun dev           # Start dev (Electron + Vite)
bun run build     # Production build
bun run lint      # Biome lint check
bun run lint:fix  # Auto-fix lint
bun run typecheck # TypeScript check
bun run package   # Build .dmg for macOS
```

IMPORTANT: Always run `bun run lint && bun run typecheck` before committing.

## Code Style

- Biome for linting/formatting — never Prettier or ESLint
- 2-space indent, 100 char line width, double quotes, always semicolons
- ES5 trailing commas, shorthand array types (`T[]` not `Array<T>`)
- ES module imports (import/export), not CommonJS
- Follow existing patterns before inventing new ones

## Architecture

Single Electron app with two renderer windows:

| Window | Purpose |
|--------|---------|
| Main (400x600) | Timer, session log, history |
| Break (fullscreen) | Full-screen break overlay |

- Main process: `src/main/` — window management, tray, IPC, storage
- Preload: `src/preload/` — context bridge between main and renderer
- Timer renderer: `src/renderer/` — React app with timer UI
- Break renderer: `src/break/` — React app for fullscreen break

## Timer Behavior

1. Countdown to target duration (25/50/90 min)
2. At 0:00: notification, then counts UP (overtime/flow mode)
3. User manually ends session → logs what they did
4. Break queued, user starts manually → fullscreen overlay

## Tailwind 4

CSS-first config — no `tailwind.config.ts`. Theme tokens in `globals.css`:
- `@import "tailwindcss"` at top
- Dark theme only: bg #0a0a0a, accent cyan #22d3ee
- JetBrains Mono for all text

## Git Workflow

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Imperative mood, lowercase after type, no period, max ~72 chars
- Never add Co-Authored-By lines
- Stage specific files, never `git add -A`
