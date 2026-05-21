import type { ButtonHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

export interface BulkActionButtonProps {
  label: string
  onClick: () => void
  className?: ButtonHTMLAttributes<HTMLButtonElement>["className"]
}

export function BulkActionButton({ label, onClick, className }: BulkActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border-3 border-double bg-[#252525] px-2 active:scale-90 active:border-black hover:text-black hover:border-transparent",
        className
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
