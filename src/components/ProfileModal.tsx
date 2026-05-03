import { useState } from 'react'
import { UsernameModal } from './UsernameModal'
import { PlayerIconAvatar } from './PlayerIconAvatar'
import { TITLES, type Title } from '../hooks/useTitle'

type Props = {
  onClose:        () => void
  onBack:         () => void
  username:       string
  title:          Title
  playerIcon:     number
  onSaveUsername: (name: string) => void
  onSaveTitle:    (title: Title) => void
}

type View = 'profile' | 'editProfile' | 'editTitle'

function UsernameDisplay({ username }: { username: string }) {
  if (username.startsWith('Player#')) {
    return <><span>Player</span><span className="text-stone-400 font-medium">{username.slice(6)}</span></>
  }
  return <>{username}</>
}

export function ProfileModal({ onClose, onBack, username, title, playerIcon, onSaveUsername, onSaveTitle }: Props) {
  const [view, setView] = useState<View>('profile')
  const [showChangeUsername, setShowChangeUsername] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const titleColor = title === 'Guest' ? 'text-stone-400' : 'text-amber-400'

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
        {view === 'editTitle' ? (
          <>
            {/* Edit Title header */}
            <div className="flex items-center px-5 py-4 border-b border-stone-700">
              <button onClick={() => setView('editProfile')} className="text-stone-400 hover:text-white mr-3 text-lg leading-none">‹</button>
              <div className="text-amber-400 font-bold text-base flex-1">Choose Title</div>
              <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
            </div>

            {TITLES.map(t => (
              <button
                key={t}
                onClick={() => onSaveTitle(t)}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-stone-800 hover:bg-stone-800/50 transition-colors"
              >
                <span className="text-sm font-bold text-white">{t}</span>
                {title === t && (
                  <svg viewBox="0 0 16 16" width="14" height="14" className="text-amber-400 flex-shrink-0">
                    <path d="M2 8 L6 12 L14 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </button>
            ))}
          </>
        ) : view === 'editProfile' ? (
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
                <PlayerIconAvatar iconId={playerIcon} />
                <span className="text-stone-600 text-base leading-none">›</span>
              </div>
            </button>

            {/* Title row */}
            <button
              onClick={() => setView('editTitle')}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-stone-800 hover:bg-stone-800/50 transition-colors">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Title</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium ${titleColor}`}>{title}</span>
                <span className="text-stone-600 text-base leading-none">›</span>
              </div>
            </button>
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
              <PlayerIconAvatar iconId={playerIcon} />
              <div className="flex-1">
                <div className={`text-[9px] uppercase tracking-widest leading-none mb-1 ${titleColor}`}>{title}</div>
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
