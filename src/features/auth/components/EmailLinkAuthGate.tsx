"use client"

import type { ReactNode } from "react"
import { useEmailLinkAuth } from "../hooks/useEmailLinkAuth"
import { EmailLinkAuthLoadingState } from "./EmailLinkAuthLoadingState"
import { EmailLinkSignInView } from "./EmailLinkSignInView"
import { EmailLinkSignedInBar } from "./EmailLinkSignedInBar"
import { UsernameSetupView } from "./UsernameSetupView"
import { AuthContext } from "@/shared/lib/auth-context"

type EmailLinkAuthGateProps = {
  children: ReactNode
}

export function EmailLinkAuthGate({ children }: EmailLinkAuthGateProps) {
  const {
    user,
    emailInput,
    setEmailInput,
    manualLinkInput,
    setManualLinkInput,
    loading,
    sending,
    completing,
    googleSigningIn,
    statusMessage,
    errorMessage,
    isSignInLink,
    hasAuthConfig,
    account,
    submitEmailLink,
    submitGoogleSignIn,
    submitManualSignInLink,
    handleSignOut
  } = useEmailLinkAuth()

  if (loading || account.isLoading) {
    return <EmailLinkAuthLoadingState />
  }

  if (!user) {
    return (
      <EmailLinkSignInView
        emailInput={emailInput}
        onEmailInputChange={setEmailInput}
        onSubmitGoogleSignIn={submitGoogleSignIn}
        manualLinkInput={manualLinkInput}
        onManualLinkInputChange={setManualLinkInput}
        onSubmitEmailLink={submitEmailLink}
        onSubmitManualSignInLink={submitManualSignInLink}
        sending={sending}
        completing={completing}
        googleSigningIn={googleSigningIn}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
        isSignInLink={isSignInLink}
        hasAuthConfig={hasAuthConfig}
      />
    )
  }

  if (account.requiresUsernameSetup) {
    return <UsernameSetupView account={account} onSignOut={handleSignOut} />
  }

  return (
    <AuthContext.Provider value={{ user, account }}>
      <EmailLinkSignedInBar statusMessage={statusMessage} errorMessage={errorMessage} onSignOut={handleSignOut} account={account}>
        {children}
      </EmailLinkSignedInBar>
    </AuthContext.Provider>
  )
}
