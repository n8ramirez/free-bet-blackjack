type Props = {
  onClose:  () => void
  onBack:   () => void
  username: string
}

export function ProfileModal({ onClose, onBack, username }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]"
      onClick={onClose}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-stone-700">
          <button onClick={onBack} className="text-stone-400 hover:text-white mr-3 text-lg leading-none">‹</button>
          <div className="text-amber-400 font-bold text-base flex-1">Profile</div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
        </div>

        {/* Avatar section */}
        <div className="flex items-end gap-2.5 pl-3 pr-5 pt-4 pb-4 border-b border-stone-700">
          <div className="w-8 h-10 rounded-lg border border-stone-600 bg-stone-800 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 28" width="18" height="21" fill="none" aria-hidden>
              <circle cx="12" cy="8" r="5" fill="#57534e" />
              <path d="M2,26 C2,18 22,18 22,26" fill="#57534e" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-stone-400 text-[9px] uppercase tracking-widest leading-none mb-1">Guest</div>
            <div className="text-white font-bold text-base leading-none">
              {username.startsWith('Player#')
                ? <><span>Player</span><span className="text-stone-400 font-medium">{username.slice(6)}</span></>
                : username}
            </div>
          </div>
          <svg viewBox="0 0 26 26" width="22" height="22" fill="none" className="flex-shrink-0 self-center mr-[5px]" aria-hidden>
            {/* Rounded square open at top-right */}
            <path d="M16 3 H6 C4.3 3 3 4.3 3 6 V20 C3 21.7 4.3 23 6 23 H20 C21.7 23 23 21.7 23 20 V10"
              stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none"/>
            {/* Pencil — parallel shaft edges at 45° */}
            <path d="M21,3 L24,6 L12,18 L8,20 L9,15 Z"
              stroke="#78716c" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
            {/* Eraser band */}
            <path d="M19.5,4.5 L22,7.5"
              stroke="#78716c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Profile body — placeholder */}
        <div className="px-5 py-8 flex flex-col items-center justify-center">
          <div className="text-stone-600 text-xs uppercase tracking-widest">Coming Soon</div>
        </div>
      </div>
    </div>
  )
}
