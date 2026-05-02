import { useState } from 'react'
import { UsernameModal } from './UsernameModal'

type Props = {
  onClose:        () => void
  onBack:         () => void
  username:       string
  onSaveUsername: (name: string) => void
}

type View = 'profile' | 'editProfile'

function UsernameDisplay({ username }: { username: string }) {
  if (username.startsWith('Player#')) {
    return <><span>Player</span><span className="text-stone-400 font-medium">{username.slice(6)}</span></>
  }
  return <>{username}</>
}

export function ProfileModal({ onClose, onBack, username, onSaveUsername }: Props) {
  const [view, setView] = useState<View>('profile')
  const [showChangeUsername, setShowChangeUsername] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

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
        {view === 'editProfile' ? (
          <>
            {/* Edit Profile header */}
            <div className="flex items-center px-5 py-4 border-b border-stone-700">
              <button onClick={() => setView('profile')} className="text-stone-400 hover:text-white mr-3 text-lg leading-none">‹</button>
              <div className="text-amber-400 font-bold text-base flex-1">Edit Profile</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>

            {showChangeUsername && (
              <UsernameModal
                mode="change"
                initialValue={username.startsWith('Player#') ? '' : username}
                onSubmit={name => { onSaveUsername(name); setShowChangeUsername(false) }}
                onSkip={() => setShowChangeUsername(false)}
              />
            )}

            {/* Username row */}
            <button
              onClick={() => setShowChangeUsername(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Username</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">
                  {username.startsWith('Player#')
                    ? <><span className="text-white">Player</span><span className="text-stone-400">{username.slice(6)}</span></>
                    : <span className="text-stone-400">{username}</span>}
                </span>
                <span className="text-stone-600 text-base leading-none">›</span>
              </div>
            </button>

            {/* Player Icon row */}
            <button
              onClick={() => setShowComingSoon(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Player Icon</span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-10 rounded-lg border border-stone-600 bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 28" width="18" height="21" fill="none" aria-hidden>
                    <circle cx="12" cy="8" r="5" fill="#57534e" />
                    <path d="M2,26 C2,18 22,18 22,26" fill="#57534e" />
                  </svg>
                </div>
                <span className="text-stone-600 text-base leading-none">›</span>
              </div>
            </button>

            {/* Title row */}
            <button
              onClick={() => setShowComingSoon(true)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Title</span>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-sm font-medium">Guest</span>
                <span className="text-stone-600 text-base leading-none">›</span>
              </div>
            </button>

            {showComingSoon && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                onClick={() => setShowComingSoon(false)}
              >
                <div
                  className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
                    border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)] px-6 py-8 flex flex-col items-center gap-3"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="text-2xl">🚧</div>
                  <div className="text-amber-400 font-bold text-base">Coming Soon</div>
                  <div className="text-stone-400 text-xs text-center">This feature is under construction.</div>
                  <button
                    onClick={() => setShowComingSoon(false)}
                    className="mt-2 text-stone-400 hover:text-stone-300 text-[9px] uppercase tracking-widest underline transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Profile header */}
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
                  <UsernameDisplay username={username} />
                </div>
              </div>
              <button
                onClick={() => setView('editProfile')}
                className="self-center mr-[5px] hover:opacity-70 transition-opacity"
              >
                <svg viewBox="0 0 26 26" width="22" height="22" fill="none" aria-hidden>
                  <path d="M16 3 H6 C4.3 3 3 4.3 3 6 V20 C3 21.7 4.3 23 6 23 H20 C21.7 23 23 21.7 23 20 V10"
                    stroke="#78716c" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M21,3 L24,6 L12,18 L8,20 L9,15 Z"
                    stroke="#78716c" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
                  <path d="M19.5,4.5 L22,7.5"
                    stroke="#78716c" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Profile body — placeholder */}
            <div className="px-5 py-8 flex flex-col items-center justify-center">
              <div className="text-stone-600 text-xs uppercase tracking-widest">Coming Soon</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
