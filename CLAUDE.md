# Free Bet Blackjack — CLAUDE Handoff

This file summarizes the project, architecture, current implementation, outstanding work, and guidance for a Claude coding agent to continue development.

---

## What the project does

Single-player Free Bet Blackjack playable in a browser (desktop & mobile). Faithful casino rules: 6-deck shoe, dealer hits soft 17 (H17), free doubles on hard 9/10/11, free splits on non-ten pairs, dealer 22 pushes all non-blackjack hands, single card on split aces, no surrender, no insurance. Three optional side bets: Pot of Gold, Push 22, Hellraiser.

Deployed to Vercel. Production URL is on the main branch; staging has a persistent preview URL.

---

## Long-term product vision

The goal is to ship this app on the **Apple App Store and Google Play Store**. The app will be free to download and play, with optional **"Pro"** features available via a one-time in-app purchase.

### Pro features (planned, not yet gated)
- Classic Blackjack Mode (rules variant already partially built)
- Deck and card theme settings
- Player titles

### Future features
- Lifetime game stats (cross-device, requires accounts)
- Achievements that unlock deck themes, card themes, and player titles

### Monetization & accounts
- One-time IAP for Pro status (no subscription)
- Users must be able to **restore their purchase** — a hard requirement from both Apple and Google
- Purchase restoration requires persistent user accounts (not just localStorage)

### Recommended implementation order

The following phases should be completed in order. Do not skip ahead — each phase is foundational for the next.

**Phase 1 — Capacitor integration**
Wrap the existing Vite/React app in a Capacitor native shell to enable App Store and Play Store distribution. This is the prerequisite for any native IAP APIs.

**Phase 2 — User authentication (Supabase Auth)**
Migrate identity from localStorage (`fbbj_username`) to Supabase Auth (email/password or social login). This enables cross-device data, purchase restoration, and persistent stats. Existing localStorage data (bankroll, settings, username) should be migrated to the user's cloud record on first sign-in.

**Phase 3 — In-app purchases**
Wire StoreKit (iOS) and Google Play Billing (Android) via a Capacitor IAP plugin. Store Pro entitlement on the Supabase user record so it survives reinstalls and device switches. Implement the "Restore Purchase" flow.

**Phase 4 — Pro feature gating**
With accounts and IAP in place, add a `isPro` flag to the app state derived from the Supabase user record. Gate Pro features behind this flag. Pro features should be fully built before this phase; the gating logic should be the last thing wired up.

**Phase 5 — Lifetime stats & achievements**
Persist per-round stats to Supabase. Build an achievements engine that evaluates unlock conditions and writes earned achievements to the user record. Achievements drive cosmetic unlocks (themes, titles).

> **Do not implement payment gating or Pro locks until Phase 4.** Build Pro features freely during earlier phases; the infrastructure to gate them doesn't exist yet and adding stubs now creates rework.

---

## Key architectural decisions

- **Frontend-only static app**: TypeScript + React + Vite. Deployed on Vercel with no backend.
- **Pure engine**: `src/engine/` is a side-effect-free TypeScript module. All game rules live here and are tested independently of the UI.
- **Thin controller hook**: `src/hooks/useGameState.ts` wraps the engine and owns all UI state, animations, and phase transitions. Components never call engine functions directly.
- **Phase-based state machine**: `Phase = 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'round-over'`. Transitions are driven by `useEffect` timers inside `useGameState`.
- **Integer cents**: All money is stored as integer cents (`betCents`) to avoid floating-point issues.
- **localStorage persistence**: Bankroll + peak bankroll persisted under key `fbbj_bankroll`. Settings (sound/music) under `fbbj_settings`. Both survive app closes, refreshes, and homescreen installs. Cleared on explicit "New Game."
- **Client-side RNG**: `crypto.getRandomValues()` + Fisher–Yates shuffle. Acceptable for casual play; move to server-side if trustless auditability is ever needed.
- **Tailwind CSS**: v3 is installed and in use throughout. `tailwind.config.js` defines custom `felt` and `felt-dark` colors for the table background.

---

## Project structure

```
src/
  App.tsx                        — top-level orchestrator; owns modal state, high-score flow, bankroll animation
  main.tsx
  engine/
    engine.ts                    — core rules: dealing, hitting, doubling, splitting, dealer play, resolution
    shoe.ts                      — deck creation, secure shuffle, draw helper
    index.ts                     — re-exports
    __tests__/
      engine.test.ts             — unit tests (Vitest)
      shoe.test.ts
  components/
    Card.tsx                     — single card rendering (rank + suit, face-down state)
    CardHand.tsx                 — hand display with total, glow effects, split/double badges
    ActionBar.tsx                — Hit / Stand / Double / Split buttons with free-bet indicators
    BetPanel.tsx                 — chip tray (9 denominations), Deal / Rebet / Clear buttons
    SideBetPanel.tsx             — sliding drawer for Pot of Gold / Push 22 / Hellraiser bets
    SideBetInfoModal.tsx         — side bet rules reference sheet
    RulesModal.tsx               — full game rules / how-to-play
    MenuModal.tsx                — hamburger menu (How to Play, Leaderboard, Settings, Restart Game, Share)
    SettingsModal.tsx            — sound effects & music toggles (persisted via useSettings)
    RestartConfirmModal.tsx      — "Are you sure?" confirmation for Restart Game
    LeaderboardModal.tsx         — top scores display with highlight on new entry
    HighScoreModal.tsx           — name entry when a session qualifies for the leaderboard
    SafeButton.tsx               — touch-safe button wrapper (prevents accidental fire on drag)
  hooks/
    useGameState.ts              — full game state, phase transitions, side bet resolution, localStorage bankroll
    useSettings.ts               — sound/music toggle state with localStorage persistence
    useLeaderboard.ts            — leaderboard read/write (currently client-side localStorage)
    useCountUp.ts                — animated bankroll counter
  assets/
    chips/                       — custom SVG chip images ($5 through $5K, 9 denominations)
STYLEGUIDE.md                    — design tokens: colors, typography, spacing, animation, component patterns
```

---

## What's been implemented

### Game engine (`src/engine/`)
- Full Free Bet Blackjack rules: dealing, hit, stand, double (free on 9/10/11), split (free on non-ten pairs, max 4 hands), single card on split aces, dealer H17, dealer 22 push rule.
- Round resolution with `HandResult[]` including `payoutCents` and `reason` string.
- Vitest unit tests covering core flows.

### UI & state
- **Dealing animation**: cards reveal one at a time (player → dealer → player → dealer) with 180ms delays.
- **Dealer animation**: hole card flip + additional cards drawn one at a time with staggered delays.
- **Splitting**: up to 4 hands displayed in a 2×2 grid with active/dimmed states.
- **Free-bet indicators**: "FREE" badge on free doubles; puck icons (🔵) for Pot of Gold counting.
- **Round-over banner**: title (Push / Player Blackjack / Dealer Blackjack / etc.) + per-side-bet result strips + net payout.
- **Hellraiser glow**: orange card glow on winning Hellraiser hands (3-card poker: flush, straight, trips, etc.).
- **Push 22 glow**: blue card glow when dealer hits 22 and Push 22 side bet is active.

### Side bets
- **Pot of Gold**: pays on free pucks (free doubles + free splits earned in the round). Dealer BJ voids. Multipliers 1–7 pucks: 3×/10×/30×/60×/100×/299×/1000×.
- **Push 22**: pays 11:1 when dealer ends on exactly 22.
- **Hellraiser**: resolved after the first two player cards + dealer upcard are revealed. Standard 3-card poker payouts (adjusted multipliers).

### Persistence & session management
- Bankroll + peak bankroll survive page reloads via `localStorage` (`fbbj_bankroll`).
- Settings (sound/music toggles) survive reloads via `localStorage` (`fbbj_settings`).
- **Restart Game** (Menu): confirm dialog → resets bankroll to $0 → triggers high-score check using preserved peak → lands on Out of Chips screen → "New Game" starts fresh at $1,000.
- **New Game** (Out of Chips screen): clears localStorage and resets to $1,000 starting bankroll.

### Modals & menus
- Hamburger menu: How to Play, Leaderboard, Settings, Restart Game (with confirm), Share (coming soon).
- Settings modal: sound effects and music toggles (both labeled "Coming Soon").
- Leaderboard + high-score entry flow: triggers automatically when a session ends with a qualifying peak bankroll.

### Assets & styling
- 9 custom SVG chip denominations ($5 / $10 / $25 / $50 / $100 / $250 / $500 / $1K / $5K).
- Tailwind CSS with custom felt colors. `STYLEGUIDE.md` documents all tokens.
- Mobile-first responsive layout using `h-[100dvh]` and safe-area-aware spacing.

---

## What's still TODO

- **Sound effects**: implemented (Howler.js sprite). **Music**: toggle exists in Settings but no audio implementation yet.
- **Share feature**: menu item placeholder only; no share/export functionality.
- **Leaderboard backend**: connected to Supabase (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars). Top-10 scores are stored in a `leaderboard` table and shared across all players.
- **Expanded engine tests**: resplit edge cases, split limits >4, penetration/reshuffle at low shoe depth, Hellraiser payout boundary conditions.
- **CI**: no GitHub Actions workflow yet. Add lint + Vitest on push/PR.
- **Accessibility**: no ARIA roles, keyboard navigation beyond Shift+D debug shortcut, or screen reader support.
- **E2E tests**: no Playwright or similar setup.

---

## Gotchas & constraints

- **Windows / PowerShell**: if `npm` is blocked, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force` first. Use `npm.cmd` as fallback.
- **Tailwind**: v3 is installed and working. Do not upgrade to v4 without verifying compatibility with the current config.
- **Client-side RNG**: shuffle is not provably fair. Fine for casual/demo play.
- **Vitest**: `npm run test` runs Vitest. Use `npx vitest` if the binary isn't found directly.
- **localStorage**: all persistence is device-local. Clearing browser data resets bankroll and settings.
- **Debug mode**: `Shift+D` in-game toggles a 4-hand split debug view for UI testing.

---

## Handoff summary for Claude coding agent

### Running locally (Windows)

```powershell
cd C:\workspace\freebet-blackjack
npm install
npm run dev        # start dev server at localhost:5173
npm run test       # run Vitest unit tests
npm run build      # production build
```

### Key files to understand first

| File | Why it matters |
|---|---|
| `src/hooks/useGameState.ts` | All game flow lives here. Read this before touching any UI. |
| `src/engine/engine.ts` | Pure rules — edit with care and run tests after any change. |
| `src/App.tsx` | Modal orchestration, high-score flow, bankroll animation wiring. |
| `src/components/BetPanel.tsx` | Chip tray and bet controls. |
| `src/components/CardHand.tsx` | Hand rendering — handles single, split, and quadrant layouts. |
| `STYLEGUIDE.md` | Design tokens. Follow these before introducing new colors or spacing. |

### Git workflow

1. Create a feature branch off `main`
2. Commit changes on the feature branch
3. Merge feature branch → `staging` and push — Vercel auto-deploys to the staging preview URL for testing
4. Once testing passes, open a PR from the feature branch → `main`
5. Squash merge the PR (`gh pr merge <n> --squash`) — merge commits are blocked by repo settings
6. Merge `main` back into `staging` and push to keep them in sync

Always confirm with the user before pushing or opening PRs. Wait for explicit go-ahead at each step.

### Recommended next tasks

Tasks are ordered by phase priority. Complete Phase 1 and 2 before building new Pro features.

**Phase 1 — Capacitor**
1. Install and configure Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`).
2. Validate that the existing Vite build runs correctly inside the Capacitor shell on both platforms.
3. Configure app icons, splash screens, and bundle identifiers for both stores.

**Phase 2 — Auth**
4. Enable Supabase Auth and add sign-up / sign-in / guest flows to the app.
5. Migrate `fbbj_username`, `fbbj_bankroll`, and `fbbj_settings` from localStorage to the authenticated user's Supabase record.
6. Ensure anonymous/guest play still works; prompt sign-in when accessing Pro features or the leaderboard.

**Near-term (can be done now, parallel to Phase 1/2)**
7. **Share**: implement a share flow (Web Share API with a score card image, or a shareable URL with peak bankroll encoded).
8. **CI**: add `.github/workflows/test.yml` to run `npm run test` on every push and PR.
9. **Music**: source audio and wire to the existing music toggle in Settings.
10. **Expanded tests**: cover Hellraiser edge cases, Push 22 with player bust, Pot of Gold with dealer BJ, and multi-split resolution order.

---

Last updated: 2026-05-04
