import { useRef } from 'react'

type SafeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function SafeButton({ onClick, disabled, onPointerDown, onPointerLeave, onPointerCancel, onPointerUp, ...rest }: SafeButtonProps) {
  const active = useRef(false)

  return (
    <button
      {...rest}
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return
        active.current = true
        e.currentTarget.releasePointerCapture(e.pointerId)
        onPointerDown?.(e)
      }}
      onPointerLeave={(e) => {
        active.current = false
        onPointerLeave?.(e)
      }}
      onPointerCancel={(e) => {
        active.current = false
        onPointerCancel?.(e)
      }}
      onPointerUp={(e) => {
        if (active.current && !disabled) {
          active.current = false
          onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>)
        }
        onPointerUp?.(e)
      }}
      onClick={undefined}
    />
  )
}
