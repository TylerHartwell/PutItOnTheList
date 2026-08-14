import { LogOut } from "lucide-react"
import type { UserAccountState } from "@/shared/types/user"

type AccountSettingsFormProps = {
  account: UserAccountState
  onSignOut: () => void
}

export function AccountSettingsForm({ account, onSignOut }: AccountSettingsFormProps) {
  return (
    <div className="select-text p-2">
      <div className="grid gap-3">
        <div>
          <span className="mb-1 block text-sm font-medium">Email address</span>
          <div className="rounded-2xl px-1 py-1 text-sm text-[#5f4a31]">{account.profile?.email || "Signed-in account"}</div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="account-username">
            Username
          </label>
          <div className="flex items-center gap-2">
            <input
              id="account-username"
              type="text"
              autoComplete="username"
              value={account.usernameInput}
              onChange={event => account.setUsernameInput(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-[#d9c8ab] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[#aa9475] focus:border-[#8a6d45] focus:ring-2 focus:ring-[#ffcf70]/40"
            />
            <button
              type="button"
              onClick={() => void account.saveUsername()}
              disabled={
                account.isSavingUsername || Boolean(account.usernameValidationMessage) || account.usernameInput === account.profile?.username
              }
              className="inline-flex items-center justify-center rounded-2xl bg-[#432000] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#301500] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {account.isSavingUsername ? "Saving" : "Save"}
            </button>
          </div>

          {account.usernameValidationMessage ? <p className="mt-1 text-xs text-[#9d3d27]">{account.usernameValidationMessage}</p> : null}
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
  )
}