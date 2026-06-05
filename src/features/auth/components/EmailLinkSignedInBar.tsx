"use client"

import { LogOut, Settings } from "lucide-react"

type EmailLinkSignedInBarProps = {
  statusMessage: string
  errorMessage: string
  onSignOut: () => void
  children: React.ReactNode
}

export function EmailLinkSignedInBar({ statusMessage, errorMessage, onSignOut, children }: EmailLinkSignedInBarProps) {
  return (
    <div className="mx-auto py-1 w-[90%] max-w-120 text-[#432000]">
      <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl ">
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center rounded-2xl border border-[#d9c8ab] bg-white px-3 py-1.5 text-sm font-medium text-[#432000] transition hover:border-[#8a6d45] hover:bg-[#fff9ef]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-2xl border border-[#d9c8ab] bg-white px-3 py-1.5 text-sm font-medium text-[#432000] transition hover:border-[#8a6d45] hover:bg-[#fff9ef]"
          aria-label="User settings (coming soon)"
        >
          <Settings className="mr-2 h-4 w-4" />
          User settings
        </button>
      </div>

      {statusMessage ? <p className="mb-4 rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{statusMessage}</p> : null}
      {errorMessage ? <p className="mb-4 rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{errorMessage}</p> : null}

      {children}
    </div>
  )
}
