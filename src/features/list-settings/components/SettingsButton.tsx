import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

type SettingsButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function SettingsButton({ className, children, ...props }: SettingsButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "px-2 py-1 rounded-md border border-transparent bg-[#252525] text-[#fdfdfd] focus:border-black focus:outline-none hover:bg-[#fdfdfd] hover:text-[#252525] active:bg-[#fdfdfd] active:text-[#252525] active:outline-2 active:outline-[#252525]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
