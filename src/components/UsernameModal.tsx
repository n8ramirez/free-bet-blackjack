import { useState } from 'react'
import filter from 'leo-profanity'
import chipIconAmber from '../assets/chips/chip-icon-amber.svg'
import { registerUsername } from '../hooks/useUsername'

filter.addWhitelist(['ass', 'butt'])

type Props = {
  onSubmit:      (displayName: string) => void
  onSkip:        () => void
  mode?:         'create' | 'change'
  initialValue?: string
}

type Step = 'input' | 'registering'

export function UsernameModal({ onSubmit, onSkip, mode = 'create', initialValue = '' }: Props) {
  const [name, setName]               = useState(initialValue)
  const [step, setStep]     = useState<Step>('input')
  const [regError, setRegError] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))
  }

  const isBadLength = name.length === 1 || name.length > 18
  const hasProfanity = name.length >= 2 && filter.check(name)
  const isInvalid    = isBadLength || hasProfanity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.length < 2 || isInvalid) return

    setStep('registering')
    setRegError(false)
    try {
      const display = await registerUsername(name)
      onSubmit(display)
    } catch {
      setRegError(true)
      setStep('input')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]">
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-stone-700">
          <div className="text-white text-[9px] uppercase tracking-widest mb-1">{mode === 'change' ? 'Profile' : 'Welcome'}</div>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-base">
            <img src={chipIconAmber} width="16" height="16" className="flex-shrink-0" />
            {mode === 'change' ? 'Change Username' : 'Create a Username'}
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
              disabled={step === 'registering'}
              className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-600
                text-white placeholder-stone-500 text-base
                focus:outline-none focus:border-amber-500 transition-colors
                disabled:opacity-50"
            />
            {hasProfanity && (
              <div className="text-red-400 text-xs text-center">Invalid username.</div>
            )}
            {isBadLength && !hasProfanity && (
              <div className="text-red-400 text-xs text-center">Username must contain 2–18 characters.</div>
            )}
            {regError && (
              <div className="text-red-400 text-xs text-center">Could not register username. Please try again.</div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setName('')}
                disabled={name.length === 0 || step === 'registering'}
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
                disabled={name.length < 2 || isInvalid || step === 'registering'}
                className="relative overflow-hidden py-4 rounded-xl font-extrabold text-base text-white
                  bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_0px_#14532d]
                  active:scale-[0.97] active:shadow-none active:translate-y-[3px] transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:translate-y-0"
              >
                <div className="absolute inset-x-0 top-0 h-3 rounded-t-xl bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
                <span className="relative">
                  {step === 'registering' ? 'Checking…' : 'Done'}
                </span>
              </button>
            </div>
          </form>

          <button
            onClick={onSkip}
            disabled={step === 'registering'}
            className="text-stone-400 hover:text-stone-300 text-[9px] uppercase tracking-widest text-center transition-colors pb-1 underline disabled:opacity-30"
          >
            {mode === 'change' ? 'Cancel' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  )
}
