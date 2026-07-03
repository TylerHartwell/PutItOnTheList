import { User } from "firebase/auth"
import React from "react"
import { createContext } from "react"
import { UserAccountState } from "../types/user"

function bundleContext<T>(defaultValue: T | null = null) {
  const context = createContext<T | null>(defaultValue)

  const useContext = () => {
    const value = React.useContext(context)

    if (value === null) {
      throw new Error("useContext must be used within a Provider")
    }
    return value
  }

  return [context.Provider, useContext] as const
}

type AuthContextValue = {
  user: User | null
  account: UserAccountState
}

export const [AuthContextProvider, useAuthContextValue] = bundleContext<AuthContextValue>()

type EmailLinkContextValue = {
  sending: boolean
  completing: boolean
  googleSigningIn: boolean
  isSignInLink: boolean
  emailInput: string
  manualLinkInput: string
  statusMessage: string
  errorMessage: string
  onEmailInputChange: (value: string) => void
  onSubmitGoogleSignIn: () => void
  onManualLinkInputChange: (value: string) => void
  onSubmitEmailLink: () => void
  onSubmitManualSignInLink: () => void
}

export const [EmailLinkContextProvider, useEmailLinkContextValue] = bundleContext<EmailLinkContextValue>()
