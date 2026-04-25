# Free Bet Blackjack — Style Guide

---

## Theme

Green felt casino aesthetic. Gold accents, dark stone neutrals, semi-transparent overlays, and pronounced interactive feedback through 3D button effects and glow animations.

---

## Colors

### Backgrounds
| Token | Tailwind | Hex | Usage |
|---|---|---|---|
| Felt (base) | `bg-felt` | `#1a3a27` | Main table surface |
| Felt light | `bg-felt-light` | `#1f4a31` | Lighter felt areas |
| Felt dark | `bg-felt-dark` | `#102416` | Darker felt areas |
| Felt border | `bg-felt-border` | `#0d1f12` | Felt edge/border |
| Panel | `bg-stone-900` | — | Top bar, bottom panel, modals |
| Panel mid | `bg-stone-800` | — | Modal rows, input fields |
| Overlay | `bg-black/70` | — | Modal backdrops |

### Action Colors
| Action | Background | Hover | Shadow |
|---|---|---|---|
| Hit / Deal / New Hand / New Game | `bg-emerald-600` | `bg-emerald-500` | `#14532d` |
| Stand | `bg-rose-700` | `bg-rose-600` | `#9f1239` |
| Double / Clear | `bg-amber-600` | `bg-amber-500` | `#92400e` |
| Split / Rebet | `bg-violet-700` | `bg-violet-600` | `#4c1d95` |

### Status Colors
| State | Text | Usage |
|---|---|---|
| Win | `text-emerald-400` | Hand result, net positive |
| Loss | `text-red-400` | Hand result, net negative, min bet warning |
| Push | `text-stone-300` | Neutral result |
| Bet / Gold accent | `text-amber-400` | Active bets, titles, monetary amounts |

### Side Bet Accent Colors
| Side Bet | Color |
|---|---|
| Pot of Gold | Amber / Gold (`amber-400`, `amber-500`) |
| Push 22 | Sky blue (`sky-400`) |
| Hellraiser | Orange (`orange-400`) |

### Text
| Role | Token |
|---|---|
| Primary | `text-white` |
| Secondary | `text-stone-300` |
| Tertiary / labels | `text-stone-400`, `text-stone-500` |
| Disabled | `text-stone-600` |
| Accent | `text-amber-400` |
| Card ranks (dark) | `text-stone-900` |
| Red suits | `text-red-600` |

---

## Typography

### Font Sizes
| Size | Tailwind | Usage |
|---|---|---|
| 9px | `text-[9px]` | Uppercase section labels (BANKROLL, BET) |
| 10px | `text-[10px]` | Rules text, marquee, secondary headers |
| 11px | `text-[11px]` | Side bet amounts, tab labels |
| 12px | `text-xs` | Badges, error messages, table rows |
| 14px | `text-sm` | Body text, menu items, modal content |
| 16px | `text-base` | Button labels, bet amounts |
| 18px | `text-lg` | Primary action buttons (Deal, New Hand) |
| 24px | `text-2xl` | Round result banners |
| 30px | `text-3xl` | Bet display in panel |
| 36px | `text-4xl` | Rank display (leaderboard) |

### Font Weights
| Weight | Token | Usage |
|---|---|---|
| 600 | `font-semibold` | Table content, secondary labels |
| 700 | `font-bold` | All buttons, monetary values, most UI labels |
| 800 | `font-extrabold` | Menu icons |
| 900 | `font-black` | FREE lammer text, icon SVGs |

### Rules
- Labels are always `uppercase tracking-widest`
- Button text is always `font-bold`
- Monetary values are always `font-bold text-amber-400`

---

## Spacing

### Gaps
| Token | Value | Usage |
|---|---|---|
| `gap-1` | 4px | Tight icon + label rows |
| `gap-1.5` | 6px | Close list items |
| `gap-2` | 8px | Standard list / button rows |
| `gap-2.5` | 10px | Action button grid |
| `gap-3` | 12px | Section spacing, chip row |
| `gap-4` | 16px | Modal section spacing |

### Padding
| Token | Value | Usage |
|---|---|---|
| `px-4` | 16px | Standard horizontal panel padding |
| `px-5` | 20px | Modal horizontal padding |
| `py-3` | 12px | Top bar, bet panel top |
| `py-4` | 16px | Action buttons, modal sections |
| `py-6` | 24px | Action bar, game over section |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded` | 4px | Small badges, payout table cells |
| `rounded-lg` | 8px | Cards |
| `rounded-xl` | 12px | All action buttons |
| `rounded-2xl` | 16px | Modals |
| `rounded-t-2xl` | 16px top | Bottom panel |
| `rounded-full` | 50% | Chip buttons, puck/lammer badges, icon circles |

---

## Shadows

### Elevation
| Use | Value |
|---|---|
| Header (downward) | `shadow-[0_4px_16px_rgba(0,0,0,0.6)]` |
| Bottom panel (upward) | `shadow-[0_-6px_24px_rgba(0,0,0,0.6)]` |
| Modal | `shadow-[0_8px_32px_rgba(0,0,0,0.8)]` |
| Card | `shadow-card` → `2px 4px 10px rgba(0,0,0,0.6)` |
| Puck / lammer | `shadow-[0_2px_6px_rgba(0,0,0,0.5)]` |

### Button Depth Shadows (3D press effect)
| Button color | Shadow value |
|---|---|
| Emerald | `shadow-[0_4px_0px_#14532d]` |
| Rose | `shadow-[0_4px_0px_#9f1239]` |
| Amber | `shadow-[0_4px_0px_#92400e]` |
| Violet | `shadow-[0_4px_0px_#4c1d95]` |

### Chip Shadow (shape-aware)
- Normal: `[filter:drop-shadow(0_5px_0px_rgba(0,0,0,0.5))]`
- Pressed: `[filter:drop-shadow(0_1px_0px_rgba(0,0,0,0.5))]`

---

## Interactive States

### Standard Action Button
```
relative overflow-hidden rounded-xl font-bold transition-all
active:scale-95 active:shadow-none active:translate-y-1
```
Top highlight overlay (applied inside every action button):
```
absolute inset-x-0 top-0 h-3 rounded-t-xl
bg-gradient-to-b from-black/25 to-transparent pointer-events-none
```

### Chip Button
```
p-0 bg-transparent border-none transition-transform
active:translate-y-[4px]
[filter:drop-shadow(0_5px_0px_rgba(0,0,0,0.5))]
active:[filter:drop-shadow(0_1px_0px_rgba(0,0,0,0.5))]
```

### Disabled State
- Buttons: `opacity-30 cursor-not-allowed` (no separate asset needed)
- Deal button when unavailable: `bg-stone-800 text-stone-600`

---

## Animations

| Name | Duration | Usage |
|---|---|---|
| `cardFlipIn` | 375ms ease-out | Card deal reveal |
| `spinBorder` | 1.45s linear ∞ | Free bet spinning highlight border |
| `glow-pulse` | 2s ease-in-out ∞ | Active split hand blue glow |
| `hellraiser-glow` | 1.2s ease-in-out ∞ | Hellraiser winning hand orange/red glow |
| `push22-glow` | 1.2s ease-in-out ∞ | Push 22 winning hand cyan glow |
| `pog-glow` | 1.2s ease-in-out ∞ | Pot of Gold lammer gold glow |
| `marquee` | 18s linear ∞ | Scrolling banner text |

---

## Component Patterns

### Modal
```
Backdrop:  fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4
Container: bg-stone-900/75 backdrop-blur-sm rounded-2xl border border-stone-700
           shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-sm w-full
```

### Free Bet Button (spinning border variant)
```
Wrapper:  rounded-[8px] p-[4px] bg-amber-500 (or bg-violet-600) relative overflow-hidden
Overlay:  absolute inset-[-200%] animate-spin-border
          conic-gradient(transparent 0deg, rgba(255,255,255,0.25) 40deg,
          rgba(255,255,255,0.7) 60deg, rgba(255,255,255,0.25) 80deg, transparent 120deg)
```

### FREE Lammer / Puck Badge
```
w-8 h-8 rounded-full bg-amber-400 border-2 border-yellow-200
shadow-[0_2px_6px_rgba(0,0,0,0.5)]
text-[8px] font-black text-amber-950 tracking-wide uppercase
```

### Tab Bar
- Inactive: `text-stone-500 hover:text-stone-300`
- Active (main bet): `text-white border-b-2 border-white -mb-px`
- Active (side bet): `text-amber-400 border-b-2 border-amber-400 -mb-px`
- Active (Push 22): `text-sky-400 border-b-2 border-sky-400 -mb-px`
- Active (Hellraiser): `text-orange-400 border-b-2 border-orange-400 -mb-px`

### Card Back
```
bg-violet-900 border border-violet-700 rounded-lg
repeating-linear-gradient(45deg, rgba(139,92,246,0.25), ...) +
repeating-linear-gradient(-45deg, rgba(139,92,246,0.25), ...)
Inner frame: absolute inset-[6px] border border-violet-600/40 rounded
```

---

## Layout

- Max content width: `max-w-sm` (384px) for modals
- Full height: `h-[100dvh]` on main container (dynamic viewport height for mobile)
- Bottom panel: `rounded-t-2xl bg-stone-900` pinned to bottom
- Card overlap: negative margin `-mt-[20px]` per card in a hand
