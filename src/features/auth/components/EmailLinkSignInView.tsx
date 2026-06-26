"use client"

import { EmailLinkSignInFormCard } from "./EmailLinkSignInFormCard"
import { EmailLinkSignInHeroPanel } from "./EmailLinkSignInHeroPanel"

type EmailLinkSignInViewProps = {
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

export function EmailLinkSignInView({
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
}: EmailLinkSignInViewProps) {
  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(238,240,244,0.82)_42%,rgba(214,195,165,0.48)_100%)] text-[#432000]">
      <div className="absolute -left-32 -top-32 h-56 w-56 rounded-full bg-[#ffcf70]/35 blur-3xl" />
      <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[#b0d8c3]/40 blur-3xl" />

      <div className="relative mx-auto flex  w-[92%] max-w-4xl items-center justify-center py-6">
        <div className="grid w-full gap-8 rounded-4xl border border-white/70 bg-white/88 p-8 shadow-[0_24px_80px_rgba(67,32,0,0.16)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <EmailLinkSignInHeroPanel />
          <EmailLinkSignInFormCard
            emailInput={emailInput}
            onEmailInputChange={onEmailInputChange}
            onSubmitGoogleSignIn={onSubmitGoogleSignIn}
            manualLinkInput={manualLinkInput}
            onManualLinkInputChange={onManualLinkInputChange}
            onSubmitEmailLink={onSubmitEmailLink}
            onSubmitManualSignInLink={onSubmitManualSignInLink}
            sending={sending}
            completing={completing}
            googleSigningIn={googleSigningIn}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            isSignInLink={isSignInLink}
            hasAuthConfig={hasAuthConfig}
          />
        </div>
      </div>
    </div>
  )
}
