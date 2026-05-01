import { useState } from 'react'
import { Card, CardBackColor } from './Card'

type Props = {
  onClose:           () => void
  soundEffects:      boolean
  music:             boolean
  classicMode:       boolean
  cardBackColor:     CardBackColor
  onSoundEffects:    (v: boolean) => void
  onMusic:           (v: boolean) => void
  onClassicMode:     () => void
  onCardBackColor:   (v: CardBackColor) => void
}

const DECK_OPTIONS: { value: CardBackColor; label: string }[] = [
  { value: 'purple', label: 'Purple' },
  { value: 'red',    label: 'Red'    },
  { value: 'blue',   label: 'Blue'   },
  { value: 'green',  label: 'Green'  },
  { value: 'black',  label: 'Black'  },
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

export function SettingsModal({ onClose, soundEffects, music, classicMode, cardBackColor, onSoundEffects, onMusic, onClassicMode, onCardBackColor }: Props) {
  const [showDeckTheme, setShowDeckTheme] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]"
      onClick={onClose}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {showDeckTheme ? (
          <>
            {/* Deck theme header */}
            <div className="flex items-center px-5 py-4 border-b border-stone-700">
              <button
                onClick={() => setShowDeckTheme(false)}
                className="text-stone-400 hover:text-white mr-3 text-lg leading-none"
              >
                ‹
              </button>
              <div className="text-amber-400 font-bold text-base flex-1">Deck Theme</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>

            {/* Deck theme options */}
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
                      <span className={`text-sm font-semibold uppercase tracking-widest ${selected ? 'text-white' : 'text-stone-400'}`}>
                        {label}
                      </span>
                    </div>
                    <Card faceDown cardBackColor={value} />
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* Main settings header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
              <div className="text-amber-400 font-bold text-base">Settings</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>

            {/* Toggles + Deck Theme row */}
            <div className="flex flex-col">
              <Toggle label="Sound Effects"       enabled={soundEffects} onToggle={() => onSoundEffects(!soundEffects)} />
              <Toggle label="Music - Coming Soon" enabled={music}        onToggle={() => onMusic(!music)} dimmed />
              <Toggle label="Classic Blackjack"   enabled={classicMode}  onToggle={onClassicMode} />

              <button
                onClick={() => setShowDeckTheme(true)}
                className="flex items-center justify-between px-5 py-4 hover:bg-stone-800/40 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Deck Theme</span>
                <span className="text-stone-400 text-base leading-none">›</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
