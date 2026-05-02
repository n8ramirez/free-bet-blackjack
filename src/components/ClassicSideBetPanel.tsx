import type { ClassicSideBetType } from '../hooks/useClassicGameState'
import { SafeButton } from './SafeButton'

function fmtDollars(cents: number): string {
  const d = cents / 100
  return d % 1 === 0 ? `${d.toLocaleString()}` : `${d.toFixed(2)}`
}

type ClassicSideBetPanelProps = {
  isOpen:                      boolean
  selectedSideBet:             ClassicSideBetType
  ladyLuckBetCents:            number
  busterBlackjackBetCents:     number
  wildSevensBetCents:          number
  onSelectSideBet:             (type: ClassicSideBetType) => void
  onShowInfo:                  () => void
}

export const LadyLuckIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 26" className={className} aria-hidden>
    <circle cx="13" cy="13" r="11.5" fill="#db2777" stroke="#f9a8d4" strokeWidth="1.2" />
    <path
      d="M13,20 C13,20 6.5,15.5 6.5,10.5 C6.5,7.8 8.6,6 11,7.5 C12,8.2 13,9.5 13,9.5 C13,9.5 14,8.2 15,7.5 C17.4,6 19.5,7.8 19.5,10.5 C19.5,15.5 13,20 13,20 Z"
      fill="white"
    />
    <text x="13" y="13.8" textAnchor="middle" fontSize="4.5" fontWeight="900" fill="#db2777" letterSpacing="0.2">20</text>
  </svg>
)

export const BusterBlackjackIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 26" className={className} aria-hidden>
    <circle cx="13" cy="13" r="11.5" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.2" />
    <polygon points="15,4 8.5,14.5 13,14.5 11,22 17.5,11.5 13,11.5" fill="white" />
  </svg>
)

export const Wild7sIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 26" className={className} aria-hidden>
    <circle cx="13" cy="13" r="11.5" fill="#059669" stroke="#6ee7b7" strokeWidth="1.2" />
    <path
      d="M 13,13 C 14,12 16,12 16,14 C 16,16 14,17 12,17 C 9,17 8,14 8,12 C 8,9 11,7 14,7 C 18,7 20,10 20,13 C 20,17 17,19 13,19"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

type TabConfig = {
  key:         ClassicSideBetType
  label:       string
  icon:        React.ReactNode
  activeColor: string
  barColor:    string
}

export function ClassicSideBetPanel({ isOpen, selectedSideBet, ladyLuckBetCents, busterBlackjackBetCents, wildSevensBetCents, onSelectSideBet, onShowInfo }: ClassicSideBetPanelProps) {
  const tabs: TabConfig[] = [
    {
      key:         'lady-luck',
      label:       'Lady Luck',
      icon:        <LadyLuckIcon className="w-4 h-4" />,
      activeColor: 'text-pink-400',
      barColor:    'bg-pink-400',
    },
    {
      key:         'buster-blackjack',
      label:       'Buster BJ',
      icon:        <BusterBlackjackIcon className="w-4 h-4" />,
      activeColor: 'text-blue-400',
      barColor:    'bg-blue-400',
    },
    {
      key:         'wild-7s',
      label:       'Wild 7s',
      icon:        <Wild7sIcon className="w-4 h-4" />,
      activeColor: 'text-emerald-400',
      barColor:    'bg-emerald-400',
    },
  ]

  return (
    <div
      className={`
        absolute bottom-full left-0 right-0 z-0
        transition-[transform,opacity] duration-200 ease-in-out
        ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
    >
      {/* Info button */}
      <SafeButton
        onClick={onShowInfo}
        className="absolute -top-12 right-7 z-10 w-8 h-8 rounded-full
          bg-stone-900 border-2 border-amber-400 text-amber-400
          hover:border-amber-300 hover:text-amber-300 transition-colors
          flex items-center justify-center text-lg font-extrabold leading-none
          shadow-[0_2px_8px_rgba(0,0,0,0.6)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
      >
        ?
      </SafeButton>

      <div className={`bg-stone-900 border-t border-stone-700 rounded-t-2xl overflow-hidden ${isOpen ? 'shadow-[0_-6px_24px_rgba(0,0,0,0.6),0_20px_0_0_#1c1917]' : ''}`}>
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
                  <span className={`text-[11px] uppercase tracking-wide font-extrabold ${tab.activeColor}`}>
                    {tab.label}
                  </span>
                </div>
                {tab.key === 'lady-luck' ? (
                  <div className={`text-base font-bold transition-colors ${ladyLuckBetCents > 0 ? 'text-pink-400' : 'text-stone-500'}`}>
                    {ladyLuckBetCents > 0 ? fmtDollars(ladyLuckBetCents) : '—'}
                  </div>
                ) : tab.key === 'buster-blackjack' ? (
                  <div className={`text-base font-bold transition-colors ${busterBlackjackBetCents > 0 ? 'text-blue-400' : 'text-stone-500'}`}>
                    {busterBlackjackBetCents > 0 ? fmtDollars(busterBlackjackBetCents) : '—'}
                  </div>
                ) : (
                  <div className={`text-base font-bold transition-colors ${wildSevensBetCents > 0 ? 'text-emerald-400' : 'text-stone-500'}`}>
                    {wildSevensBetCents > 0 ? fmtDollars(wildSevensBetCents) : '—'}
                  </div>
                )}
                <div className={`h-0.5 w-8 rounded-full ${isActive ? tab.barColor : 'bg-transparent'}`} />
              </SafeButton>
            )
          })}
        </div>
      </div>
    </div>
  )
}
