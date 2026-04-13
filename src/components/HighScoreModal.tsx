import { useState } from 'react'

type Props = {
  peakBankrollCents: number
  rank: number
  onSubmit: (name: string) => void
  onSkip: () => void
}

export function HighScoreModal({ peakBankrollCents, rank, onSubmit, onSkip }: Props) {
  const [name, setName] = useState('')

  const dollars = peakBankrollCents / 100
  const fmt = dollars % 1 === 0
    ? `$${dollars.toLocaleString()}`
    : `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(name.trim() || 'Anonymous')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-stone-700 text-center">
          <div className="text-white text-[9px] uppercase tracking-widest mb-2">New High Score</div>
          <div className="text-amber-400 font-bold text-4xl font-game">#{rank}</div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="text-center">
            <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Peak Bankroll</div>
            <div className="text-emerald-400 font-bold text-2xl font-game">{fmt}</div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-600
                text-white placeholder-stone-500 text-sm
                focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
                text-amber-950 font-bold text-base active:scale-95 transition-all
                shadow-[0_3px_0px_rgba(0,0,0,0.4)]"
            >
              Save Score
            </button>
          </form>

          <button
            onClick={onSkip}
            className="text-stone-500 hover:text-stone-300 text-sm text-center transition-colors pb-1"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
