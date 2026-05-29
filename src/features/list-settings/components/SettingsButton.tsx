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
        "px-2 py-1 rounded-md bg-[#252525] text-[#fdfdfd] cursor-pointer",
        " focus-visible:outline-gray-500 focus-visible:outline-2 focus-visible:outline-offset-1",
        "hover:bg-[#fdfdfd] hover:text-[#252525] hover:outline-2 hover:outline-[#252525]",
        "active:bg-[#fdfdfd] active:text-[#252525] active:translate-y-0.5 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
