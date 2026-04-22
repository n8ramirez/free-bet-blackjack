import { LeaderboardEntry } from '../hooks/useLeaderboard'

type Props = {
  entries: LeaderboardEntry[]
  highlightIndex?: number
  onClose: () => void
}

export function LeaderboardModal({ entries, highlightIndex, onClose }: Props) {
  const formatDollars = (cents: number) => {
    const d = cents / 100
    return d % 1 === 0
      ? `$${d.toLocaleString()}`
      : `$${d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const rankColor = (i: number) => {
    if (i === 0) return 'text-amber-400'
    if (i === 1) return 'text-stone-300'
    if (i === 2) return 'text-amber-700'
    return 'text-stone-500'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]"
      onClick={onClose}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm max-h-[80dvh] overflow-y-auto
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
          <div>
            <div className="text-white text-[9px] uppercase tracking-widest">All Time</div>
            <div className="text-amber-400 font-bold text-base">Peak Bankroll Leaderboard</div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          {entries.length === 0 ? (
            <div className="text-stone-500 text-sm text-center py-10 flex flex-col gap-1">
              <span>No scores yet.</span>
              <span className="text-stone-600 text-xs">Beat your starting bankroll to get on the board!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => {
                const isHighlight = i === highlightIndex
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                      ${isHighlight
                        ? 'bg-amber-500/20 border border-amber-500/50'
                        : 'bg-stone-800/60'}`}
                  >
                    <div className={`text-sm font-bold w-6 text-right flex-shrink-0 ${rankColor(i)}`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm truncate
                        ${isHighlight ? 'text-amber-300' : 'text-stone-200'}`}>
                        {entry.name}
                      </div>
                    </div>
                    <div className={`font-bold text-sm flex-shrink-0
                      ${isHighlight ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatDollars(entry.peak_bankroll_cents)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
