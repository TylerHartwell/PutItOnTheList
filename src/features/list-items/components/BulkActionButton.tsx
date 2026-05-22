import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

export interface BulkActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export function BulkActionButton({ label, className, ...buttonProps }: BulkActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border-3 border-double bg-[#252525] px-2 active:scale-90 active:border-black hover:text-black hover:border-transparent",
        className
      )}
      {...buttonProps}
    >
      {label}
    </button>
  )
}
