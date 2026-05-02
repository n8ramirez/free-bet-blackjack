import { useState } from 'react'
import filter from 'leo-profanity'
import chipIconAmber from '../assets/chips/chip-icon-amber.svg'

filter.addWhitelist(['ass', 'butt'])

type Props = {
  onSubmit: (name: string) => void
  onSkip:   () => void
}

export function UsernameModal({ onSubmit, onSkip }: Props) {
  const [name, setName] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
  }

  const isBadLength = name.length === 1 || name.length > 18
  const check   = name.length >= 2 && filter.check(name)
  const isInvalid   = isBadLength || check

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.length >= 2 && name.length <= 18 && !filter.check(name)) onSubmit(name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]">
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-stone-700">
          <div className="text-white text-[9px] uppercase tracking-widest mb-1">Welcome</div>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-base">
            <img src={chipIconAmber} width="16" height="16" className="flex-shrink-0" />
            Create a Username
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="text-white text-xs">
            Username will appear on your player profile and leaderboard. 
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={handleChange}
              placeholder="Username"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-600
                text-white placeholder-stone-500 text-base
                focus:outline-none focus:border-amber-500 transition-colors"
            />
            {check && (
              <div className="text-red-400 text-xs text-center">
                Invalid username.
              </div>
            )}
            {isBadLength && !check && (
              <div className="text-red-400 text-xs text-center">
                Username must contain 2-18 characters.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setName('')}
                disabled={name.length === 0}
                className="relative overflow-hidden py-4 rounded-xl font-extrabold text-base text-white
                  bg-amber-600 hover:bg-amber-500 shadow-[0_4px_0px_#92400e]
                  active:scale-[0.97] active:shadow-none active:translate-y-[3px] transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0"
              >
                <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
                <span className="relative">Clear</span>
              </button>
              <button
                type="submit"
                disabled={name.length < 2 || isInvalid}
                className="relative overflow-hidden py-4 rounded-xl font-extrabold text-base text-white
                  bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_0px_#14532d]
                  active:scale-[0.97] active:shadow-none active:translate-y-[3px] transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0"
              >
                <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
                <span className="relative">Done</span>
              </button>
            </div>
          </form>

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
