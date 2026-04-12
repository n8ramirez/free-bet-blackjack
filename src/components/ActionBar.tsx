
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
  label:     string
  onClick:   () => void
  disabled?: boolean
  free?:     boolean  // highlight with yellow ring when action is free
  color:     string   // Tailwind bg/shadow classes
}

function ActionBtn({ label, onClick, disabled, free, color }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-0.5
        py-4 rounded-xl font-bold text-white transition-all
        shadow-[0_4px_0px_rgba(0,0,0,0.4)]
        active:shadow-[0_1px_0px_rgba(0,0,0,0.4)]
        active:translate-y-[3px]
        ${color}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-[0.97]'}
        ${free ? 'ring-2 ring-amber-400' : ''}
      `}
    >
      <span className="text-base leading-none">{label}</span>
    </button>
  )
}

export function ActionBar({
  canHit, canStand, canDouble, canSplit,
  isFreeDouble, isFreeSplit,
  onHit, onStand, onDouble, onSplit,
}: ActionBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pt-4 pb-6">
      <ActionBtn
        label="Hit"
        onClick={onHit}
        disabled={!canHit}
        color="bg-sky-700 hover:bg-sky-600"
      />
      <ActionBtn
        label="Stand"
        onClick={onStand}
        disabled={!canStand}
        color="bg-rose-700 hover:bg-rose-600"
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
        onClick={onSplit}
        disabled={!canSplit}
        color="bg-violet-700 hover:bg-violet-600"
      />
    </div>
  )
}
