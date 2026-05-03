import { PlayerIconAvatar } from './PlayerIconAvatar'

type Props = {
  peakBankrollCents: number
  rank: number
  username: string
  title: string
  playerIcon: number
  onSubmit: () => void
  onSkip: () => void
  mode?: 'freebet' | 'classic'
}

export function HighScoreModal({ peakBankrollCents, rank, username, title, playerIcon, onSubmit, onSkip, mode = 'freebet' }: Props) {
  const dollars = peakBankrollCents / 100
  const fmt = dollars % 1 === 0
    ? `${dollars.toLocaleString()}`
    : `${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-stone-700 text-center">
          <div className="text-white text-[9px] uppercase tracking-widest mb-2">
            {mode === 'classic' ? 'Classic · New High Score' : 'Free Bet Pro · New High Score'}
          </div>
          <div className="text-amber-400 font-bold text-4xl">#{rank}</div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="text-center">
            <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1">Peak Bankroll</div>
            <div className="text-emerald-400 font-bold text-2xl">{fmt}</div>
          </div>

          {/* Player profile */}
          <div className="flex items-end gap-2.5 justify-center">
            <PlayerIconAvatar iconId={playerIcon} />
            <div>
              <div className={`text-[9px] uppercase tracking-widest leading-none mb-1 ${title === 'Guest' ? 'text-stone-400' : 'text-amber-400'}`}>{title}</div>
              <div className="text-white font-bold text-base leading-none">
                {username.startsWith('Player#')
                  ? <><span>Player</span><span className="text-stone-400 font-medium">{username.slice(6)}</span></>
                  : username}
              </div>
            </div>
          </div>

          <button
            onClick={onSubmit}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400
              text-amber-950 text-base font-extrabold active:scale-95 transition-all
              shadow-[0_3px_0px_rgba(0,0,0,0.4)]"
          >
            Save Score
          </button>

          <button
            onClick={onSkip}
            className="text-stone-400 hover:text-stone-300 text-[9px] uppercase tracking-widest text-center transition-colors pb-1 underline"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
