"use client"

import type { ReactNode } from "react"
import { useEmailLinkAuth } from "../hooks/useEmailLinkAuth"
import { EmailLinkAuthLoadingState } from "./EmailLinkAuthLoadingState"
import { EmailLinkSignInView } from "./EmailLinkSignInView"
import { EmailLinkSignedInBar } from "./EmailLinkSignedInBar"
import { UsernameSetupView } from "./UsernameSetupView"
import { AuthContextProvider, EmailLinkContextProvider } from "@/shared/lib/bundleContext"

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
      <EmailLinkContextProvider
        value={{
          sending,
          completing,
          googleSigningIn,
          isSignInLink,
          emailInput,
          manualLinkInput,
          statusMessage,
          errorMessage,
          onEmailInputChange: setEmailInput,
          onSubmitGoogleSignIn: submitGoogleSignIn,
          onManualLinkInputChange: setManualLinkInput,
          onSubmitEmailLink: submitEmailLink,
          onSubmitManualSignInLink: submitManualSignInLink
        }}
      >
        <EmailLinkSignInView />
      </EmailLinkContextProvider>
    )
  }

  if (account.requiresUsernameSetup) {
    return <UsernameSetupView account={account} onSignOut={handleSignOut} />
  }

  return (
    <AuthContextProvider value={{ user, account }}>
      <EmailLinkSignedInBar statusMessage={statusMessage} errorMessage={errorMessage} onSignOut={handleSignOut} account={account}>
        {children}
      </EmailLinkSignedInBar>
    </AuthContextProvider>
  )
}
