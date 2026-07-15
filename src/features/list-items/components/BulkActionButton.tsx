import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"
import { vibrate } from "@/shared/utils/vibrate"

export interface BulkActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function BulkActionButton({ label, className, ...buttonProps }: BulkActionButtonProps) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    buttonProps.onClick?.(event)
    vibrate()
  }

  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border-3 border-double bg-[#252525] px-2 active:scale-90 active:border-black hover:text-black hover:border-transparent",
        className
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      {label}
    </button>
  )
}
