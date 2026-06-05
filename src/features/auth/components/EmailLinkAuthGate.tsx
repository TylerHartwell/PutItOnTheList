"use client"

import type { ReactNode } from "react"
import { useEmailLinkAuth } from "../hooks/useEmailLinkAuth"
import { EmailLinkAuthLoadingState } from "./EmailLinkAuthLoadingState"
import { EmailLinkSignInView } from "./EmailLinkSignInView"
import { EmailLinkSignedInBar } from "./EmailLinkSignedInBar"

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
    submitEmailLink,
    handleSignOut
  } = useEmailLinkAuth()

  if (loading) {
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

  return (
    <EmailLinkSignedInBar statusMessage={statusMessage} errorMessage={errorMessage} onSignOut={handleSignOut}>
      {children}
    </EmailLinkSignedInBar>
  )
}
