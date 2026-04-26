type Props = {
  onConfirm: () => void
  onCancel:  () => void
}

export function RestartConfirmModal({ onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10dvh]"
      onClick={onCancel}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
          <div className="text-amber-400 font-bold text-base">Restart Game</div>
          <button onClick={onCancel} className="text-stone-400 hover:text-white text-xl leading-none px-2">✕</button>
        </div>

        <div className="px-5 py-5 text-stone-300 text-sm">
          Are you sure you want to restart? Your current bankroll will be reset.
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
          >
            Restart
          </button>
        </div>
      </div>
    </div>
  )
}
