type Props = {
  onClose:        () => void
  soundEffects:   boolean
  music:          boolean
  onSoundEffects: (v: boolean) => void
  onMusic:        (v: boolean) => void
}

function Toggle({ label, enabled, onToggle, dimmed }: { label: string; enabled: boolean; onToggle: () => void; dimmed?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
      <span className={`text-[10px] font-bold uppercase tracking-widest ${dimmed ? 'text-stone-600' : 'text-white'}`}>{label}</span>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0
          ${enabled ? 'bg-amber-500' : 'bg-stone-700'}`}
      >
        <span className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

export function SettingsModal({ onClose, soundEffects, music, onSoundEffects, onMusic }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]"
      onClick={onClose}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
          <div className="text-amber-400 font-bold text-base">Settings</div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
        </div>

        <div className="flex flex-col">
          <Toggle label="Sound Effects"       enabled={soundEffects} onToggle={() => onSoundEffects(!soundEffects)} />
          <Toggle label="Music - Coming Soon" enabled={music}        onToggle={() => onMusic(!music)} dimmed />
        </div>
      </div>
    </div>
  )
}
