# Free Bet Blackjack — CLAUDE Handoff

This file summarizes the project, architecture, current implementation, outstanding work, and a short handoff for a Claude coding agent to continue development.

---

## What the project does

- Single-player Free Bet Blackjack playable in a browser (desktop & mobile). Faithful casino rules for Free Bet Blackjack: 6-deck shoe, dealer hits soft 17 (H17), free doubles on 9/10/11, dealer 22 pushes non-blackjack player hands, single split aces, no surrender, no insurance for MVP.

## Key architectural decisions

- Frontend-first, static web app stack: TypeScript + React + Vite for fast local dev and Vercel deployment.
- Game rules and core engine implemented as a pure-ish TypeScript module under `src/engine` so logic is testable and UI-agnostic.
- RNG and shuffle: client-side secure RNG via `crypto.getRandomValues()` + Fisher–Yates shuffle for the MVP. Server-side shuffle + seed-publish can be added later for auditability.
- Financial math uses integer cents (`betCents`) to avoid floating-point rounding issues.
- Minimal dependencies to keep install/test simple (some styling tooling was removed to avoid install issues during scaffold/testing).

## What's been implemented

- Project scaffold: Vite + React + TypeScript project (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`).
- Core engine: `src/engine/engine.ts` implements shoe creation, dealing, hand totals, blackjack detection, free-double logic, splitting, dealer play (H17), and round resolution including Free Bet rules (dealer 22, free-double payouts, split ace behavior).
- Shoe utilities: `src/engine/shoe.ts` provides deck creation, secure shuffle, draw, and initial deal helper.
- Tests: comprehensive unit tests for engine behaviors in `src/engine/__tests__/engine.test.ts` using Vitest.
- Basic UI shell: `src/App.tsx` with a simple Deal button wiring to `dealInitial()` for manual testing.
- README with quick start instructions and Windows PowerShell notes.

## What's still TODO

- Finish and polish the frontend UI: pixel-art sprite assets (Balatro-inspired), responsive table layout, controls, chip animations, keyboard shortcuts.
- Wire UI to full engine flow: allow bet input, Hit/Stand/Double/Split actions, visual indicators for free doubles, per-hand resolution display, bankroll tracking.
- Implement comprehensive unit tests for all edge cases not yet covered (additional split/resplit flows, split limits, resplit logic beyond 4 hands, penetration/shoe reshuffle behavior tests).
- Add CI: GitHub Actions to run lint + tests on PRs.
- Add optional server-side shuffle and auditability endpoints (if public sharing and proof-of-fairness desired).
- Accessibility, E2E tests (Playwright), deployment configuration for Vercel, and optional persistence (leaderboards, accounts) if desired later.

## Gotchas & constraints

- Node & npm required locally. On Windows, PowerShell may block `npm` scripts until you set execution policy (`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force`). Also use `npm.cmd` if `npm` PowerShell wrapper issues persist.
- During initial scaffolding some styling packages (Tailwind, PostCSS) were removed from `package.json` to avoid `ETARGET` registry errors; re-add them later when implementing the UI if desired, pin to known-good versions.
- Current RNG/shuffle is client-side. This is acceptable for local play/MVP but not for trustless auditability. If you plan to let strangers play or wager real value, move shuffle to server-side and publish seed hashes.
- Tests use Vitest; the `test` script runs `vitest`. If the `vitest` binary isn't found, use `npx vitest` as a fallback.

## Handoff summary for Claude coding agent

Goal: continue implementation toward a playable MVP UI and complete engine test coverage; optionally add server-side shuffle and deploy to Vercel.

Workspace pointers:
- `package.json` — scripts and dependencies. Run `npm install` then `npm run test` or `npx vitest`.
- `src/engine/engine.ts` — core rule implementation. Key exported functions/types:
  - `createGameState(decks?, startingBetCents?)`
  - `dealInitial(state, betCents?)`
  - `playerDouble(state, handIndex)`
  - `playerHit(state, handIndex)`
  - `playerSplit(state, handIndex)`
  - `dealerPlay(state)`
  - `resolveRound(state)` -> `HandResult[]` with `payoutCents` and `reason`
- `src/engine/shoe.ts` — `createShoe`, `shuffle`, `draw`, `dealInitial` helper.
- `src/engine/__tests__/engine.test.ts` — current unit tests and examples of how engine is exercised.
- `src/App.tsx` — minimal UI stub demonstrating `dealInitial` usage.

Recommended next tasks for CLAUDE:
1. Expand unit tests to exhaustively cover edge cases listed in TODOs (resplits, complex split/double interactions, penetration/reshuffle, rounding). Use seeded deterministic shoe if helpful (modify `createShoe` to accept a seed or inject a mock shuffle).
2. Build a simple responsive UI: betting controls, per-hand action buttons, visual free-double indicators, and per-hand result panel. Create pixel-art placeholders (32x32 PNGs) for cards/chips.
3. Add a minimal state machine around `GameState` to support turn-by-turn actions (player action loop, then dealerPlay(), then resolveRound()). Keep engine pure where possible and have a thin controller for state transitions.
4. Reintroduce styling dependencies only after UI work; pin versions and test `npm install`. If Tailwind is wanted, add `tailwindcss@^3.4.24` or the current working version in the registry.
5. Add GitHub Actions workflow to run tests on push/PR. Keep secrets out of the repo.

Operational notes for running locally (Windows):

```powershell
# Set PowerShell execution policy for the current user (if needed):
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# Install deps and run tests:
cd C:\workspace\freebet-blackjack
npm install
npm run test

# If `vitest` can't be found:
npx vitest
```

If anything in tests or install fails, include the full `npm install` output and the current `package.json` so the agent can fix dependency issues.

---

Created for handoff on: 2026-04-11
