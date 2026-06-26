"use client"

import { useState } from "react"
import { LogOut, Settings, X } from "lucide-react"
import type { UserAccountState } from "../hooks/useUserProfile"

type EmailLinkSignedInBarProps = {
  statusMessage: string
  errorMessage: string
  onSignOut: () => void
  account: UserAccountState
  children: React.ReactNode
}

export function EmailLinkSignedInBar({ statusMessage, errorMessage, onSignOut, account, children }: EmailLinkSignedInBarProps) {
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false)

  return (
    <div className="mx-auto py-1 w-[90%] max-w-120 text-[#432000]">
      <div className="mb-3 flex items-center justify-end gap-2 rounded-2xl ">
        <button
          type="button"
          onClick={() => setIsAccountSettingsOpen(currentValue => !currentValue)}
          className="inline-flex items-center rounded-2xl border border-[#d9c8ab] bg-white px-3 py-1.5 text-sm font-medium text-[#432000] transition hover:border-[#8a6d45] hover:bg-[#fff9ef]"
          aria-pressed={isAccountSettingsOpen}
          aria-label="Toggle account settings"
        >
          <Settings className="mr-2 h-4 w-4" />
          Account
        </button>
      </div>

      {isAccountSettingsOpen ? (
        <div className="mb-3 rounded-3xl border border-[#d9c8ab] bg-[#fff9ef] p-4 shadow-[0_12px_32px_rgba(67,32,0,0.08)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#8a6d45]">Account settings</p>
              <p className="mt-1 text-sm leading-6 text-[#5f4a31]">Set a unique username for this Firebase account.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsAccountSettingsOpen(false)}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d9c8ab] bg-white text-[#432000] transition hover:border-[#8a6d45] hover:bg-[#fff4de]"
              aria-label="Close account settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3">
            <div>
              <span className="mb-1 block text-sm font-medium">Email address</span>
              <div className="rounded-2xl border border-[#e5d7be] bg-white px-4 py-3 text-sm text-[#5f4a31]">
                {account.profile?.email || "Signed-in account"}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="account-username">
                Username
              </label>
              <input
                id="account-username"
                type="text"
                autoComplete="nickname"
                value={account.usernameInput}
                onChange={event => account.setUsernameInput(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-2xl border border-[#d9c8ab] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[#aa9475] focus:border-[#8a6d45] focus:ring-2 focus:ring-[#ffcf70]/40"
              />
              {account.usernameValidationMessage ? <p className="mt-1 text-xs text-[#9d3d27]">{account.usernameValidationMessage}</p> : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void account.saveUsername()}
                disabled={account.isSavingUsername || Boolean(account.usernameValidationMessage)}
                className="inline-flex items-center justify-center rounded-2xl bg-[#432000] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#301500] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {account.isSavingUsername ? "Saving" : "Save username"}
              </button>

              <p className="text-xs leading-5 text-[#7f6545]">Use 6-18 characters with lowercase letters, numbers, or underscores.</p>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center justify-center self-start rounded-2xl border border-[#d9c8ab] bg-white px-4 py-2.5 text-sm font-medium text-[#432000] transition hover:border-[#8a6d45] hover:bg-[#fff4de]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>

            {account.statusMessage ? <p className="rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{account.statusMessage}</p> : null}
            {account.errorMessage ? <p className="rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{account.errorMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {statusMessage ? <p className="mb-4 rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{statusMessage}</p> : null}
      {errorMessage ? <p className="mb-4 rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{errorMessage}</p> : null}

      {children}
    </div>
  )
}
