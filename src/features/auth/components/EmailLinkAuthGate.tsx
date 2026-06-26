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
    loading,
    sending,
    completing,
    statusMessage,
    errorMessage,
    isSignInLink,
    hasAuthConfig,
    account,
    submitEmailLink,
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
        onSubmitEmailLink={submitEmailLink}
        sending={sending}
        completing={completing}
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
