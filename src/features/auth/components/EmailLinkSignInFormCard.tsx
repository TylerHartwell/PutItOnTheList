import { Loader2, Mail } from "lucide-react"

type EmailLinkSignInFormCardProps = {
  emailInput: string
  onEmailInputChange: (value: string) => void
  onSubmitEmailLink: () => void
  sending: boolean
  completing: boolean
  statusMessage: string
  errorMessage: string
  isSignInLink: boolean
  hasAuthConfig: boolean
}

export function EmailLinkSignInFormCard({
  emailInput,
  onEmailInputChange,
  onSubmitEmailLink,
  sending,
  completing,
  statusMessage,
  errorMessage,
  isSignInLink,
  hasAuthConfig
}: EmailLinkSignInFormCardProps) {
  return (
    <div className="flex flex-col justify-center rounded-3xl border border-[#e9ddc4] bg-[#fffdf8] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-8">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#432000] text-white shadow-lg shadow-[#432000]/20">
        <Mail className="h-6 w-6" />
      </div>

      <h2 className="mt-5 text-2xl font-medium">Sign in with email</h2>
      <p className="mt-2 text-sm leading-6 text-[#6a563c]">
        Receive a one-time link to your inbox. Open that link on this device to finish signing in.
      </p>

      <form
        className="mt-6"
        onSubmit={event => {
          event.preventDefault()
          onSubmitEmailLink()
        }}
      >
        <label className="block text-sm font-medium text-[#5f4a31]" htmlFor="email-link-address">
          Email address
        </label>
        <input
          id="email-link-address"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={emailInput}
          onChange={event => onEmailInputChange(event.target.value)}
          placeholder="you@example.com"
          required
          className="mt-2 w-full rounded-2xl border border-[#d9c8ab] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[#aa9475] focus:border-[#8a6d45] focus:ring-2 focus:ring-[#ffcf70]/40"
        />

        <button
          type="submit"
          disabled={sending || completing}
          className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#432000] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#301500] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending || completing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSignInLink ? "Finishing sign in" : "Sending link"}
            </>
          ) : isSignInLink ? (
            "Finish sign in"
          ) : (
            "Send sign-in link"
          )}
        </button>
      </form>

      {statusMessage ? <p className="mt-4 rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-4 rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{errorMessage}</p> : null}
      {!hasAuthConfig ? (
        <p className="mt-4 text-xs leading-5 text-[#8f6f50]">Add the Firebase web app env vars before using email-link auth.</p>
      ) : null}
    </div>
  )
}
