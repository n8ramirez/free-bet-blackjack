type SideBetSection = 'pot-of-gold' | 'coming-soon-1' | 'coming-soon-2'

type SideBetPanelProps = {
  isOpen:            boolean
  potOfGoldBetCents: number
}

const PotOfGoldIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 26 27" className={className} aria-hidden>
    {/* Bottom-left lammer */}
    <circle cx="8" cy="20" r="6" fill="#fbbf24" stroke="#fef9c3" strokeWidth="1.2" />
    <text x="8" y="22.2" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#78350f" letterSpacing="0.3">FREE</text>
    {/* Bottom-right lammer */}
    <circle cx="18" cy="20" r="6" fill="#fbbf24" stroke="#fef9c3" strokeWidth="1.2" />
    <text x="18" y="22.2" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#78350f" letterSpacing="0.3">FREE</text>
    {/* Top lammer — rendered last so it sits on top */}
    <circle cx="13" cy="13" r="6" fill="#fbbf24" stroke="#fef9c3" strokeWidth="1.2" />
    <text x="13" y="15.2" textAnchor="middle" fontSize="3.5" fontWeight="900" fill="#78350f" letterSpacing="0.3">FREE</text>
  </svg>
)

function fmtDollars(cents: number): string {
  const d = Math.abs(cents) / 100
  return d % 1 === 0 ? `$${d.toLocaleString()}` : `$${d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export { PotOfGoldIcon }

export function SideBetPanel({ isOpen, potOfGoldBetCents }: SideBetPanelProps) {
  const selected: SideBetSection = 'pot-of-gold'

  return (
    <div
      className={`
        absolute bottom-full left-0 right-0 z-0
        bg-stone-900 border-t border-stone-700 rounded-t-2xl overflow-hidden
        transition-[transform,opacity] duration-200 ease-in-out
        ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto shadow-[0_-6px_24px_rgba(0,0,0,0.6),0_20px_0_0_#1c1917]' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
    >
      {/* Section tabs */}
      <div className="flex border-b border-stone-700">
        {/* Pot of Gold */}
        <div className="flex-1 flex flex-col items-center gap-0.5 py-2 px-2 border-r border-stone-700
          bg-stone-800 cursor-default">
          <div className="flex items-center gap-1.5">
            <PotOfGoldIcon className="w-4 h-4" />
            <span className="text-amber-400 text-[11px] font-bold uppercase tracking-wide">Pot of Gold</span>
          </div>
          <div className={`text-base font-bold font-game transition-colors ${potOfGoldBetCents > 0 ? 'text-amber-400' : 'text-stone-500'}`}>
            {potOfGoldBetCents > 0 ? fmtDollars(potOfGoldBetCents) : '—'}
          </div>
          <div className={`h-0.5 w-8 rounded-full ${selected === 'pot-of-gold' ? 'bg-amber-400' : 'bg-transparent'}`} />
        </div>

        {/* Coming Soon 1 */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 px-2 border-r border-stone-700 opacity-40 cursor-not-allowed">
          <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wide">Coming Soon</span>
        </div>

        {/* Coming Soon 2 */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 px-2 opacity-40 cursor-not-allowed">
          <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wide">Coming Soon</span>
        </div>
      </div>

    </div>
  )
}
