import type { SideBetType } from '../hooks/useGameState'
import { SafeButton } from './SafeButton'

type SideBetPanelProps = {
  isOpen:             boolean
  selectedSideBet:    SideBetType
  potOfGoldBetCents:  number
  push22BetCents:     number
  hellraiserBetCents: number
  onSelectSideBet:    (type: SideBetType) => void
}

export const PotOfGoldIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 27" className={className} aria-hidden>
    <circle cx="8" cy="20" r="6" fill="#fbbf24" stroke="#fef9c3" strokeWidth="1.2" />
    <text x="8" y="22.2" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#78350f" letterSpacing="0.3">FREE</text>
    <circle cx="18" cy="20" r="6" fill="#fbbf24" stroke="#fef9c3" strokeWidth="1.2" />
    <text x="18" y="22.2" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#78350f" letterSpacing="0.3">FREE</text>
    <circle cx="13" cy="13" r="6" fill="#fbbf24" stroke="#fef9c3" strokeWidth="1.2" />
    <text x="13" y="15.2" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#78350f" letterSpacing="0.3">FREE</text>
  </svg>
)

export const Push22Icon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 26" className={className} aria-hidden>
    <circle cx="13" cy="13" r="11.5" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.2" />
    <text x="9.5" y="15" textAnchor="middle" fontSize="9" fontWeight="900" fill="#e0f2fe">2</text>
    <text x="16.5" y="17.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#e0f2fe">2</text>
  </svg>
)

export const HellraiserIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 26" className={className} aria-hidden>
    <circle cx="13" cy="16" r="12.5" fill="#fb923c" fillOpacity="0.4" stroke="#fb923c" strokeWidth="1.2" />
    {/* Cards fan from a pivot at bottom-center, overlapping left to right */}
    <g transform="translate(0, -2)">
      {/* Left card — furthest back */}
      <g transform="translate(-2.5, 0) rotate(-32, 13, 25)">
        <rect x="8.5" y="9" width="9" height="16" rx="1.5" fill="#fef2f2" stroke="#d1d5db" strokeWidth="0.5" />
        <text x="13" y="14.5" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#b91c1c">6</text>
        <polygon points="13,16 15,18.8 13,21.6 11,18.8" fill="#b91c1c" />
      </g>
      {/* Center card */}
      <g transform="rotate(0, 13, 25)">
        <rect x="8.5" y="9" width="9" height="16" rx="1.5" fill="#fef2f2" stroke="#d1d5db" strokeWidth="0.5" />
        <text x="13" y="14.5" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#b91c1c">6</text>
        <polygon points="13,16 15,18.8 13,21.6 11,18.8" fill="#b91c1c" />
      </g>
      {/* Right card — in front */}
      <g transform="translate(2.5, 0) rotate(32, 13, 25)">
        <rect x="8.5" y="9" width="9" height="16" rx="1.5" fill="#fef2f2" stroke="#d1d5db" strokeWidth="0.5" />
        <text x="13" y="14.5" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#b91c1c">6</text>
        <polygon points="13,16 15,18.8 13,21.6 11,18.8" fill="#b91c1c" />
      </g>
    </g>
  </svg>
)

function fmtDollars(cents: number): string {
  const d = Math.abs(cents) / 100
  return d % 1 === 0 ? `$${d.toLocaleString()}` : `$${d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type TabConfig = {
  key:       SideBetType
  label:     string
  icon:      React.ReactNode
  betCents:  number
  activeColor: string
  barColor:    string
}

export function SideBetPanel({ isOpen, selectedSideBet, potOfGoldBetCents, push22BetCents, hellraiserBetCents, onSelectSideBet }: SideBetPanelProps) {
  const tabs: TabConfig[] = [
    {
      key:         'pot-of-gold',
      label:       'Pot of Gold',
      icon:        <PotOfGoldIcon className="w-4 h-4" />,
      betCents:    potOfGoldBetCents,
      activeColor: 'text-amber-400',
      barColor:    'bg-amber-400',
    },
    {
      key:         'push-22',
      label:       'Push 22',
      icon:        <Push22Icon className="w-4 h-4" />,
      betCents:    push22BetCents,
      activeColor: 'text-sky-400',
      barColor:    'bg-sky-400',
    },
    {
      key:         'hellraiser',
      label:       'Hellraiser',
      icon:        <HellraiserIcon className="w-4 h-4" />,
      betCents:    hellraiserBetCents,
      activeColor: 'text-orange-400',
      barColor:    'bg-orange-400',
    },
  ]

  return (
    <div
      className={`
        absolute bottom-full left-0 right-0 z-0
        bg-stone-900 border-t border-stone-700 rounded-t-2xl overflow-hidden
        transition-[transform,opacity] duration-200 ease-in-out
        ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto shadow-[0_-6px_24px_rgba(0,0,0,0.6),0_20px_0_0_#1c1917]' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
    >
      <div className="flex border-b border-stone-700">
        {tabs.map((tab, i) => {
          const isActive = selectedSideBet === tab.key
          return (
            <SafeButton
              key={tab.key}
              onClick={() => onSelectSideBet(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-2 transition-colors
                ${i < tabs.length - 1 ? 'border-r border-stone-700' : ''}
                ${isActive ? 'bg-stone-800' : 'bg-stone-900 hover:bg-stone-800/60'}`}
            >
              <div className="flex items-center gap-1.5">
                {tab.icon}
                <span className={`text-[11px] font-bold uppercase tracking-wide ${tab.activeColor}`}>
                  {tab.label}
                </span>
              </div>
              <div className={`text-base font-bold transition-colors ${tab.betCents > 0 ? tab.activeColor : 'text-stone-500'}`}>
                {tab.betCents > 0 ? fmtDollars(tab.betCents) : '—'}
              </div>
              <div className={`h-0.5 w-8 rounded-full ${isActive ? tab.barColor : 'bg-transparent'}`} />
            </SafeButton>
          )
        })}
      </div>
    </div>
  )
}
