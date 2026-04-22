import { useRef } from 'react'

type SafeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function SafeButton({ onClick, disabled, onPointerDown, onPointerLeave, onPointerCancel, onPointerUp, ...rest }: SafeButtonProps) {
  const active = useRef(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <button
      ref={btnRef}
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
          const rect = btnRef.current?.getBoundingClientRect()
          if (rect) {
            const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top  && e.clientY <= rect.bottom
            if (!inside) return
          }
          onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>)
        }
        onPointerUp?.(e)
      }}
      onClick={undefined}
    />
  )
}
