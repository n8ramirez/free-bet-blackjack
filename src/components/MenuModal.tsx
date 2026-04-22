type Props = {
  onClose:         () => void
  onHowToPlay:     () => void
  onLeaderboard:   () => void
}

type MenuItemProps = {
  label:    string
  icon?:    React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

function MenuItem({ label, icon, onClick, disabled }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-5 py-4 text-base font-semibold border-b border-stone-800 transition-colors
        ${disabled
          ? 'text-stone-600 cursor-default'
          : 'text-white hover:bg-stone-800 active:bg-stone-700'}`}
    >
      {disabled ? (
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Coming Soon</span>
      ) : (
        <span className="flex items-center gap-3">
          {icon}
          {label}
        </span>
      )}
    </button>
  )
}

export function MenuModal({ onClose, onHowToPlay, onLeaderboard }: Props) {
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
          <div className="text-amber-400 font-bold text-base">Menu</div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        {/* Menu items */}
        <div className="flex flex-col">
          <MenuItem
            label="How to Play"
            icon={
              <span className="w-5 h-5 rounded-full border-2 border-amber-400 text-amber-400
                flex items-center justify-center text-sm font-extrabold leading-none flex-shrink-0">
                ?
              </span>
            }
            onClick={() => { onClose(); onHowToPlay() }}
          />
          <MenuItem
            label="Leaderboard"
            icon={
              <span className="w-5 h-5 rounded-full border-2 border-amber-400 text-amber-400
                flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 14 11" width="9" height="7" fill="currentColor">
                  <rect x="0" y="4" width="4" height="7" rx="0.5" />
                  <rect x="5" y="1" width="4" height="10" rx="0.5" />
                  <rect x="10" y="6" width="4" height="5" rx="0.5" />
                </svg>
              </span>
            }
            onClick={() => { onClose(); onLeaderboard() }}
          />
          <MenuItem label="Statistics" disabled />
          <MenuItem label="Settings"   disabled />
          <MenuItem label="Share"      disabled />
        </div>
      </div>
    </div>
  )
}
