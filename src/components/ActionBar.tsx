
type ActionBarProps = {
  canHit:      boolean
  canStand:    boolean
  canDouble:   boolean
  canSplit:    boolean
  isFreeDouble: boolean
  isFreeSplit:  boolean
  onHit:    () => void
  onStand:  () => void
  onDouble: () => void
  onSplit:  () => void
}

type BtnProps = {
  label:      string
  onClick:    () => void
  disabled?:  boolean
  free?:      boolean
  freeVariant?: 'gold' | 'purple'
  color:      string
}

function ActionBtn({ label, onClick, disabled, free, freeVariant = 'gold', color }: BtnProps) {
  const btn = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-0.5
        py-4 font-bold text-white transition-all
        shadow-[0_4px_0px_rgba(0,0,0,0.4)]
        active:shadow-[0_1px_0px_rgba(0,0,0,0.4)]
        active:translate-y-[3px]
        ${free ? 'relative w-full rounded-[8px]' : 'rounded-xl'}
        ${color}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-[0.97]'}
      `}
    >
      <span className="text-base leading-none">{label}</span>
    </button>
  )

  if (free) {
    const baseBg = freeVariant === 'purple' ? 'bg-violet-600' : 'bg-amber-500'
    return (
      <div className={`relative rounded-xl p-[4px] overflow-hidden ${baseBg}`}>
        {/* Spinning bright highlight over the base color */}
        <div
          className="absolute inset-[-200%] animate-spin-border pointer-events-none"
          style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.25) 40deg, rgba(255,255,255,0.7) 60deg, rgba(255,255,255,0.25) 80deg, transparent 120deg)' }}
        />
        {btn}
      </div>
    )
  }

  return btn
}

export function ActionBar({
  canHit, canStand, canDouble, canSplit,
  isFreeDouble, isFreeSplit,
  onHit, onStand, onDouble, onSplit,
}: ActionBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pt-4 pb-6">
      <ActionBtn
        label="Stand"
        onClick={onStand}
        disabled={!canStand}
        color="bg-rose-700 hover:bg-rose-600"
      />
      <ActionBtn
        label="Hit"
        onClick={onHit}
        disabled={!canHit}
        color="bg-emerald-600 hover:bg-emerald-500"
      />
      <ActionBtn
        label="Double"
        free={isFreeDouble}
        onClick={onDouble}
        disabled={!canDouble}
        color="bg-amber-600 hover:bg-amber-500"
      />
      <ActionBtn
        label="Split"
        free={isFreeSplit}
        freeVariant="purple"
        onClick={onSplit}
        disabled={!canSplit}
        color="bg-violet-700 hover:bg-violet-600"
      />
    </div>
  )
}
