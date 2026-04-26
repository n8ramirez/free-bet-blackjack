type Props = {
  onClose:        () => void
  onHowToPlay:    () => void
  onLeaderboard:  () => void
  onSettings:     () => void
  onRestartGame:  () => void
}

type MenuItemProps = {
  label:      string
  icon?:      React.ReactNode
  onClick?:   () => void
  disabled?:  boolean
  comingSoon?: boolean
}

function MenuItem({ label, icon, onClick, disabled, comingSoon }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-5 py-4 text-base font-semibold border-b border-stone-800 transition-colors
        ${disabled
          ? 'text-stone-600 cursor-default'
          : 'text-white hover:bg-stone-800 active:bg-stone-700'}`}
    >
      {comingSoon ? (
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

export function MenuModal({ onClose, onHowToPlay, onLeaderboard, onSettings, onRestartGame }: Props) {
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
          <MenuItem
            label="Settings"
            icon={
              <span className="w-5 h-5 rounded-full border-2 border-amber-400 text-amber-400 flex-shrink-0"
                style={{display:'grid', placeItems:'center'}}>
                <svg viewBox="0.2 0.4 14 14" width="13" height="13" fill="currentColor">
                  <path fillRule="evenodd" d="M5.45,1.21 L8.55,1.21 L8.04,3.14 L9.83,4.17 L11.24,2.76 L12.8,5.45 L10.86,5.96 L10.86,8.04 L12.8,8.55 L11.24,11.24 L9.83,9.83 L8.04,10.86 L8.55,12.8 L5.45,12.8 L5.96,10.86 L4.17,9.83 L2.76,11.24 L1.2,8.55 L3.14,8.04 L3.14,5.96 L1.2,5.45 L2.76,2.76 L4.17,4.17 L5.96,3.14 Z M9.5,7 A2.5,2.5 0 1 0 4.5,7 A2.5,2.5 0 1 0 9.5,7 Z"/>
                </svg>
              </span>
            }
            onClick={() => { onClose(); onSettings() }}
          />
          <MenuItem
            label="Restart Game"
            icon={
              <span className="w-5 h-5 rounded-full border-2 border-amber-400 text-amber-400 flex-shrink-0"
                style={{display:'grid', placeItems:'center'}}>
                <svg viewBox="0 0 14 14" width="11" height="11" fill="currentColor">
                  <rect x="2.5" y="-0.75" width="3.2" height="1.5" rx="0.75" transform="translate(6.6,7) rotate(0)"/>
                  <rect x="2.5" y="-0.75" width="3.2" height="1.5" rx="0.75" transform="translate(6.6,7) rotate(72)"/>
                  <rect x="2.5" y="-0.75" width="3.2" height="1.5" rx="0.75" transform="translate(6.6,7) rotate(144)"/>
                  <rect x="2.5" y="-0.75" width="3.2" height="1.5" rx="0.75" transform="translate(6.6,7) rotate(216)"/>
                  <rect x="2.5" y="-0.75" width="3.2" height="1.5" rx="0.75" transform="translate(6.6,7) rotate(288)"/>
                </svg>
              </span>
            }
            onClick={() => { onClose(); onRestartGame() }}
          />
          <MenuItem label="Share" disabled comingSoon />
        </div>
      </div>
    </div>
  )
}
