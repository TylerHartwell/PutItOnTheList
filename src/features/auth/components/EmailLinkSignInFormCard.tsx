import { Loader2, Mail } from "lucide-react"

type EmailLinkSignInFormCardProps = {
  emailInput: string
  onEmailInputChange: (value: string) => void
  onSubmitGoogleSignIn: () => void
  manualLinkInput: string
  onManualLinkInputChange: (value: string) => void
  onSubmitEmailLink: () => void
  onSubmitManualSignInLink: () => void
  sending: boolean
  completing: boolean
  googleSigningIn: boolean
  statusMessage: string
  errorMessage: string
  isSignInLink: boolean
  hasAuthConfig: boolean
}

export function EmailLinkSignInFormCard({
  emailInput,
  onEmailInputChange,
  onSubmitGoogleSignIn,
  manualLinkInput,
  onManualLinkInputChange,
  onSubmitEmailLink,
  onSubmitManualSignInLink,
  sending,
  completing,
  googleSigningIn,
  statusMessage,
  errorMessage,
  isSignInLink,
  hasAuthConfig
}: EmailLinkSignInFormCardProps) {
  const isAnySignInBusy = sending || completing || googleSigningIn

  async function pasteManualLinkFromClipboard() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return
    }

    if (!window.isSecureContext || !navigator.clipboard?.readText) {
      return
    }

    try {
      const clipboardText = await navigator.clipboard.readText()
      if (clipboardText.trim()) {
        onManualLinkInputChange(clipboardText.trim())
      }
    } catch {
      // Clipboard access can be denied by browser permissions.
    }
  }

  return (
    <div className="flex flex-col justify-center rounded-3xl border border-[#e9ddc4] bg-[#fffdf8] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:p-8">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#432000] text-white shadow-lg shadow-[#432000]/20">
        <Mail className="h-6 w-6" />
      </div>

      <h2 className="mt-5 text-2xl font-medium">Sign in with email</h2>
      <p className="mt-2 text-sm leading-6 text-[#6a563c]">
        Receive a one-time link to your inbox. Open that link on this device to finish signing in.
      </p>
      <p className="mt-2 text-xs leading-5 text-[#8f6f50]">
        iPhone note: Home Screen web apps and Safari may not share sign-in storage. If the link opens in Safari, finish sign-in there and continue
        using Safari for that session.
      </p>

      <button
        type="button"
        onClick={onSubmitGoogleSignIn}
        disabled={isAnySignInBusy}
        className="mt-6 inline-flex items-center justify-center rounded-2xl border border-[#d9c8ab] bg-white px-5 py-3 text-sm font-medium text-[#432000] transition hover:bg-[#fff2db] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleSigningIn ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening Google sign in
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="#EA4335"
                d="M12 10.2v4.1h5.9c-.3 1.3-1.7 3.7-5.9 3.7-3.6 0-6.5-2.9-6.5-6.5S8.4 5 12 5c2 0 3.3.8 4.1 1.6l2.8-2.7C17.2 2.3 14.8 1.2 12 1.2 6 1.2 1.2 6 1.2 12S6 22.8 12 22.8c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"
              />
              <path
                fill="#34A853"
                d="M1.2 7.2l3.4 2.5c.9-2.7 3.4-4.7 6.4-4.7 2 0 3.3.8 4.1 1.6l2.8-2.7C17.2 2.3 14.8 1.2 12 1.2c-4.6 0-8.6 2.6-10.8 6z"
              />
              <path
                fill="#FBBC05"
                d="M12 22.8c2.7 0 5.1-.9 6.8-2.6l-3.2-2.6c-.9.6-2.1 1-3.6 1-4.1 0-5.6-2.4-5.9-3.7l-3.3 2.6c2.2 3.5 6 5.3 9.2 5.3z"
              />
              <path fill="#4285F4" d="M23.5 12c0-.8-.1-1.4-.2-2H12v4.1h6c-.3 1.4-1.1 2.7-2.4 3.5l3.2 2.6c1.9-1.8 4.7-4.9 4.7-10.2z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <p className="mt-2 text-xs leading-5 text-[#8f6f50]">Use Google for faster sign in. If your browser blocks popups, we will redirect instead.</p>

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
          disabled={isAnySignInBusy}
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

      <div className="mt-6 border-t border-[#eadfcb] pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#8f6f50]">Manual fallback</p>
        <p className="mt-2 text-xs leading-5 text-[#8f6f50]">
          If email opens in Safari, copy the full link from the address bar, paste it below in this Home Screen app, then continue.
        </p>

        <form
          className="mt-3"
          onSubmit={event => {
            event.preventDefault()
            onSubmitManualSignInLink()
          }}
        >
          <label className="block text-sm font-medium text-[#5f4a31]" htmlFor="manual-email-link">
            Email sign-in link
          </label>
          <button
            type="button"
            onClick={() => {
              void pasteManualLinkFromClipboard()
            }}
            className="mt-2 inline-flex items-center justify-center rounded-xl border border-[#d9c8ab] px-3 py-2 text-xs font-medium text-[#5f4a31] transition hover:bg-[#fff2db]"
          >
            Paste from clipboard
          </button>
          <textarea
            id="manual-email-link"
            value={manualLinkInput}
            onChange={event => onManualLinkInputChange(event.target.value)}
            placeholder="https://..."
            rows={3}
            className="mt-2 w-full resize-y rounded-2xl border border-[#d9c8ab] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#aa9475] focus:border-[#8a6d45] focus:ring-2 focus:ring-[#ffcf70]/40"
          />

          <button
            type="submit"
            disabled={isAnySignInBusy}
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-[#432000] px-5 py-3 text-sm font-medium text-[#432000] transition hover:bg-[#fff2db] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {completing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finishing sign in
              </>
            ) : (
              "Sign in from pasted link"
            )}
          </button>
        </form>
      </div>

      {statusMessage ? <p className="mt-4 rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5a3f]">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-4 rounded-2xl bg-[#ffe9e4] px-4 py-3 text-sm text-[#9d3d27]">{errorMessage}</p> : null}
      {!hasAuthConfig ? (
        <p className="mt-4 text-xs leading-5 text-[#8f6f50]">Add the Firebase web app env vars before using email-link auth.</p>
      ) : null}
    </div>
  )
}
