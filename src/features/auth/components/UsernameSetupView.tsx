"use client"

import { UserAccountState } from "@/shared/types/user"
import { Loader2, LogOut } from "lucide-react"

type UsernameSetupViewProps = {
  account: UserAccountState
  onSignOut: () => void
}

export function UsernameSetupView({ account, onSignOut }: UsernameSetupViewProps) {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(238,240,244,0.82)_42%,rgba(214,195,165,0.48)_100%)] text-[#432000]">
      <div className="absolute -left-32 -top-32 h-56 w-56 rounded-full bg-[#ffcf70]/35 blur-3xl" />
      <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[#b0d8c3]/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-[92%] max-w-3xl items-center justify-center py-12">
        <div className="w-full rounded-4xl border border-white/70 bg-white/88 px-8 py-10 shadow-[0_24px_80px_rgba(67,32,0,0.16)] backdrop-blur md:px-10 md:py-12">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#8a6d45]">Finish setup</p>
              <h1 className="mt-3 text-3xl font-medium">Choose your username</h1>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center rounded-2xl border border-[#d9c8ab] bg-white px-3 py-1.5 text-sm font-medium text-[#432000] transition hover:border-[#8a6d45] hover:bg-[#fff9ef]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </button>
          </div>

          <p className="max-w-xl text-sm leading-6 text-[#5f4a31]">
            This account needs a username before you can use the shopping list. Your email stays private and will not be used as a default.
          </p>

          <form
            className="mt-8 grid gap-4"
            onSubmit={event => {
              event.preventDefault()
              void account.saveUsername()
            }}
          >
            <div>
              <span className="mb-1 block text-sm font-medium">Signed-in email</span>
              <div className="rounded-2xl border border-[#e5d7be] bg-white px-4 py-3 text-sm text-[#5f4a31]">
                {account.profile?.email || "Signed-in account"}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="setup-username">
                Username
              </label>
              <input
                id="setup-username"
                type="text"
                autoComplete="nickname"
                value={account.usernameInput}
                onChange={event => account.setUsernameInput(event.target.value)}
                placeholder="Choose a username"
                required
                className="w-full rounded-2xl border border-[#d9c8ab] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[#aa9475] focus:border-[#8a6d45] focus:ring-2 focus:ring-[#ffcf70]/40"
              />
              {account.usernameValidationMessage ? <p className="mt-1 text-xs text-[#9d3d27]">{account.usernameValidationMessage}</p> : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={account.isSavingUsername || Boolean(account.usernameValidationMessage)}
                className="inline-flex items-center justify-center rounded-2xl bg-[#432000] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#301500] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {account.isSavingUsername ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving username
                  </>
                ) : (
                  "Continue"
                )}
              </button>

              <p className="text-xs leading-5 text-[#7f6545]">Use 6-18 characters with lowercase letters, numbers, or underscores.</p>
            </div>

            {account.statusMessage ? <p className="rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{account.statusMessage}</p> : null}
            {account.errorMessage ? <p className="rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{account.errorMessage}</p> : null}
          </form>
        </div>
      </div>
    </div>
  )
}
