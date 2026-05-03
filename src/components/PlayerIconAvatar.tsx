import { Card } from './Card'
import { PLAYER_ICONS } from '../hooks/usePlayerIcon'

type Props = { iconId: number }

export function PlayerIconAvatar({ iconId }: Props) {
  if (iconId === 0) {
    return (
      <div className="w-8 h-10 rounded-lg border border-stone-600 bg-stone-800 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 24 28" width="18" height="21" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="5" fill="#57534e" />
          <path d="M2,26 C2,18 22,18 22,26" fill="#57534e" />
        </svg>
      </div>
    )
  }

  const icon = PLAYER_ICONS[iconId]
  return (
    <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 32, height: 40 }}>
      <div style={{ transform: 'scale(0.615)', transformOrigin: 'top left' }}>
        <Card card={icon.card ?? undefined} />
      </div>
    </div>
  )
}
