import { createContext, useContext } from "react"
import type { User } from "firebase/auth"
import type { UserAccountState } from "@/features/auth/hooks/useUserProfile"

type AuthContextValue = {
  user: User | null
  account: UserAccountState
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error("useAuth must be used within EmailLinkAuthGate")
  }

  return context
}
