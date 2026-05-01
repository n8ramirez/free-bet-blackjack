import { useState } from 'react'
import { Card, CardBackColor } from './Card'
import { TableTheme, TABLE_PALETTES } from '../hooks/useSettings'

type Props = {
  onClose:          () => void
  soundEffects:     boolean
  music:            boolean
  classicMode:      boolean
  cardBackColor:    CardBackColor
  tableTheme:       TableTheme
  onSoundEffects:   (v: boolean) => void
  onMusic:          (v: boolean) => void
  onClassicMode:    () => void
  onCardBackColor:  (v: CardBackColor) => void
  onTableTheme:     (v: TableTheme) => void
}

const DECK_OPTIONS: { value: CardBackColor; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'red',    label: 'Red'    },
  { value: 'blue',   label: 'Blue'   },
  { value: 'green',  label: 'Green'  },
  { value: 'gold',   label: 'Gold'   },
  { value: 'black',  label: 'Black'  },
]

const TABLE_OPTIONS: { value: TableTheme; label: string }[] = [
  { value: 'green',    label: 'Green'  },
  { value: 'blue',     label: 'Blue'   },
  { value: 'red',      label: 'Red'    },
  { value: 'purple',   label: 'Purple' },
  { value: 'charcoal', label: 'Black'  },
]

function Toggle({ label, enabled, onToggle, dimmed }: { label: string; enabled: boolean; onToggle: () => void; dimmed?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
      <span className={`text-[10px] uppercase tracking-widest font-extrabold ${dimmed ? 'text-stone-600' : 'text-white'}`}>{label}</span>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
          ${enabled ? 'bg-amber-500' : 'bg-stone-700'}`}
      >
        <span className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

type View = 'main' | 'deckTheme' | 'tableTheme'

export function SettingsModal({ onClose, soundEffects, music, classicMode, cardBackColor, tableTheme, onSoundEffects, onMusic, onClassicMode, onCardBackColor, onTableTheme }: Props) {
  const [view, setView] = useState<View>('main')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]"
      onClick={onClose}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {view === 'deckTheme' ? (
          <>
            <div className="flex items-center px-5 py-4 border-b border-stone-700">
              <button onClick={() => setView('main')} className="text-stone-400 hover:text-white mr-3 text-lg leading-none">‹</button>
              <div className="text-amber-400 font-bold text-base flex-1">Deck Theme</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>
            <div className="flex flex-col py-2">
              {DECK_OPTIONS.map(({ value, label }) => {
                const selected = cardBackColor === value
                return (
                  <button
                    key={value}
                    onClick={() => onCardBackColor(value)}
                    className={`flex items-center justify-between px-5 py-3 transition-colors
                      ${selected ? 'bg-stone-800/60' : 'hover:bg-stone-800/40'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 text-amber-400 text-sm font-bold leading-none ${selected ? 'opacity-100' : 'opacity-0'}`}>✓</span>
                      <span className={`text-sm font-semibold uppercase tracking-widest ${selected ? 'text-white' : 'text-stone-400'}`}>{label}</span>
                    </div>
                    <Card faceDown cardBackColor={value} />
                  </button>
                )
              })}
            </div>
          </>
        ) : view === 'tableTheme' ? (
          <>
            <div className="flex items-center px-5 py-4 border-b border-stone-700">
              <button onClick={() => setView('main')} className="text-stone-400 hover:text-white mr-3 text-lg leading-none">‹</button>
              <div className="text-amber-400 font-bold text-base flex-1">Table Theme</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>
            <div className="flex flex-col py-2">
              {TABLE_OPTIONS.map(({ value, label }) => {
                const selected = tableTheme === value
                const palette  = TABLE_PALETTES[value]
                return (
                  <button
                    key={value}
                    onClick={() => onTableTheme(value)}
                    className={`flex items-center justify-between px-5 py-3 transition-colors
                      ${selected ? 'bg-stone-800/60' : 'hover:bg-stone-800/40'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 text-amber-400 text-sm font-bold leading-none ${selected ? 'opacity-100' : 'opacity-0'}`}>✓</span>
                      <span className={`text-sm font-semibold uppercase tracking-widest ${selected ? 'text-white' : 'text-stone-400'}`}>{label}</span>
                    </div>
                    <div
                      className="w-14 h-9 rounded-lg border border-white/10 flex-shrink-0"
                      style={{ backgroundColor: palette.felt }}
                    />
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
              <div className="text-amber-400 font-bold text-base">Settings</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>
            <div className="flex flex-col">
              <Toggle label="Sound Effects"       enabled={soundEffects} onToggle={() => onSoundEffects(!soundEffects)} />
              <Toggle label="Music - Coming Soon" enabled={music}        onToggle={() => onMusic(!music)} dimmed />
              <Toggle label="Classic Blackjack"   enabled={classicMode}  onToggle={onClassicMode} />
              <button
                onClick={() => setView('deckTheme')}
                className="flex items-center justify-between px-5 py-4 border-b border-stone-800 hover:bg-stone-800/40 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Deck Theme</span>
                <span className="text-stone-400 text-base leading-none">›</span>
              </button>
              <button
                onClick={() => setView('tableTheme')}
                className="flex items-center justify-between px-5 py-4 hover:bg-stone-800/40 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Table Theme</span>
                <span className="text-stone-400 text-base leading-none">›</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
