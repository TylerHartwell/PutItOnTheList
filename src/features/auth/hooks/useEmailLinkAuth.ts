"use client"

import { useEffect, useState } from "react"
import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signOut,
  type User
} from "firebase/auth"
import { auth, firebaseAuthReady, getFirebaseAuthUnavailableMessage } from "@/shared/lib/firebase"
import { useUserProfile } from "./useUserProfile"

const PENDING_EMAIL_KEY = "putitonthelist.pendingEmailForSignIn"
const AUTH_UNAVAILABLE_MESSAGE = getFirebaseAuthUnavailableMessage()

function getFriendlyError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Something went wrong while handling the sign-in link."
}

export function useEmailLinkAuth() {
  const firebaseAuth = auth
  const [user, setUser] = useState<User | null>(null)
  const [emailInput, setEmailInput] = useState("")
  const [loading, setLoading] = useState(() => Boolean(firebaseAuth))
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState(() => (firebaseAuth ? "" : AUTH_UNAVAILABLE_MESSAGE))
  const [isSignInLink, setIsSignInLink] = useState(false)
  const account = useUserProfile(user)

  useEffect(() => {
    if (!firebaseAuth) {
      return
    }

    let isCancelled = false

    const unsubscribe = onAuthStateChanged(firebaseAuth, nextUser => {
      if (isCancelled) {
        return
      }

      setUser(nextUser)
      if (nextUser) {
        setStatusMessage("")
      }
      setLoading(false)
    })

    const completeLinkIfPresent = async () => {
      if (typeof window === "undefined") {
        return
      }

      const currentUrl = window.location.href
      if (!isSignInWithEmailLink(firebaseAuth, currentUrl)) {
        setIsSignInLink(false)
        return
      }

      setIsSignInLink(true)

      const storedEmail = window.localStorage.getItem(PENDING_EMAIL_KEY) ?? ""
      if (!storedEmail) {
        setStatusMessage("Enter the email address you used to request the link.")
        setLoading(false)
        return
      }

      setEmailInput(storedEmail)
      setCompleting(true)

      try {
        await setPersistence(firebaseAuth, browserLocalPersistence)
        const credential = await signInWithEmailLink(firebaseAuth, storedEmail, currentUrl)
        window.localStorage.removeItem(PENDING_EMAIL_KEY)
        window.history.replaceState({}, document.title, window.location.pathname)

        if (!isCancelled) {
          setUser(credential.user)
          setStatusMessage("")
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getFriendlyError(error))
        }
      } finally {
        if (!isCancelled) {
          setCompleting(false)
          setLoading(false)
        }
      }
    }

    void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {})
    void completeLinkIfPresent()

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [firebaseAuth])

  async function submitEmailLink() {
    if (!firebaseAuth) {
      setErrorMessage(AUTH_UNAVAILABLE_MESSAGE)
      return
    }

    const trimmedEmail = emailInput.trim()
    if (!trimmedEmail) {
      setErrorMessage("Enter an email address first.")
      return
    }

    setErrorMessage("")
    setStatusMessage("")

    try {
      await setPersistence(firebaseAuth, browserLocalPersistence)

      if (typeof window === "undefined") {
        return
      }

      const currentUrl = window.location.href
      const actionCodeSettings = {
        url: `${window.location.origin}${window.location.pathname}`,
        handleCodeInApp: true
      }

      if (isSignInWithEmailLink(firebaseAuth, currentUrl)) {
        setCompleting(true)
        const credential = await signInWithEmailLink(firebaseAuth, trimmedEmail, currentUrl)
        window.localStorage.removeItem(PENDING_EMAIL_KEY)
        window.history.replaceState({}, document.title, window.location.pathname)
        setUser(credential.user)
        setStatusMessage("")
        return
      }

      setSending(true)
      await sendSignInLinkToEmail(firebaseAuth, trimmedEmail, actionCodeSettings)
      window.localStorage.setItem(PENDING_EMAIL_KEY, trimmedEmail)
      setStatusMessage(
        `Sign-in link sent to ${trimmedEmail}. Open the email on this device to continue. Check your spam folder if you don't see it within a few minutes.`
      )
    } catch (error) {
      setErrorMessage(getFriendlyError(error))
    } finally {
      setSending(false)
      setCompleting(false)
    }
  }

  async function handleSignOut() {
    if (!firebaseAuth) {
      setErrorMessage(AUTH_UNAVAILABLE_MESSAGE)
      return
    }

    setErrorMessage("")

    try {
      await signOut(firebaseAuth)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PENDING_EMAIL_KEY)
      }
      setEmailInput("")
      setStatusMessage("Signed out.")
    } catch (error) {
      setErrorMessage(getFriendlyError(error))
    }
  }

  return {
    user,
    emailInput,
    setEmailInput,
    loading,
    sending,
    completing,
    statusMessage,
    errorMessage,
    isSignInLink,
    hasAuthConfig: firebaseAuthReady,
    account,
    submitEmailLink,
    handleSignOut
  }
}
