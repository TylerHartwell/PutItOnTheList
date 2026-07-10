"use client"

import { useCallback, useEffect, useState } from "react"
import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailLink,
  signOut,
  type User
} from "firebase/auth"
import { firebaseAuth } from "@/shared/lib/firebase"
import { useUserProfile } from "./useUserProfile"
import { decodeAmpersandEntity, normalizePastedLinkInput } from "@/shared/utils/text"

const PENDING_EMAIL_KEY = "putitonthelist.pendingEmailForSignIn"
const AUTH_UNAVAILABLE_MESSAGE = "Firebase auth is not configured. Set the Firebase web app env vars in Netlify and redeploy."
const FIREBASE_AUTH_QUERY_KEYS = ["apiKey", "oobCode", "mode", "lang", "continueUrl", "continue_url"] as const
const NESTED_LINK_QUERY_KEYS = ["continueUrl", "continue_url", "link", "deep_link_id", "url"] as const

function resolveEmailSignInLink(rawInput: string, auth: NonNullable<typeof firebaseAuth>) {
  const initialCandidate = normalizePastedLinkInput(rawInput)
  if (!initialCandidate) {
    return ""
  }

  const urlsToInspect: string[] = [initialCandidate]
  const visited = new Set<string>()

  while (urlsToInspect.length > 0) {
    const current = urlsToInspect.shift()
    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)

    if (isSignInWithEmailLink(auth, current)) {
      return current
    }

    try {
      const parsed = new URL(current)

      for (const nestedKey of NESTED_LINK_QUERY_KEYS) {
        const nestedValue = parsed.searchParams.get(nestedKey)
        if (nestedValue) {
          urlsToInspect.push(decodeAmpersandEntity(nestedValue))
        }
      }

      if (parsed.hash) {
        const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""))
        for (const nestedKey of NESTED_LINK_QUERY_KEYS) {
          const nestedHashValue = hashParams.get(nestedKey)
          if (nestedHashValue) {
            urlsToInspect.push(decodeAmpersandEntity(nestedHashValue))
          }
        }
      }
    } catch {
      // Ignore malformed URL segments and keep searching nested values.
    }
  }

  return ""
}

function clearFirebaseAuthQueryParamsFromCurrentUrl() {
  if (typeof window === "undefined") {
    return
  }

  const currentUrl = new URL(window.location.href)
  let didRemoveAny = false

  for (const key of FIREBASE_AUTH_QUERY_KEYS) {
    if (currentUrl.searchParams.has(key)) {
      currentUrl.searchParams.delete(key)
      didRemoveAny = true
    }
  }

  if (!didRemoveAny) {
    return
  }

  const nextQuery = currentUrl.searchParams.toString()
  const nextPath = `${currentUrl.pathname}${nextQuery ? `?${nextQuery}` : ""}${currentUrl.hash}`
  window.history.replaceState({}, document.title, nextPath)
}

function parseEmailHintFromUrl(rawUrl: string) {
  const urlsToInspect: string[] = [rawUrl]
  const visited = new Set<string>()

  while (urlsToInspect.length > 0) {
    const current = urlsToInspect.shift()
    if (!current || visited.has(current)) {
      continue
    }

    visited.add(current)

    try {
      const parsed = new URL(current)
      const directEmailHint = parsed.searchParams.get("emailHint")
      if (directEmailHint) {
        return decodeURIComponent(directEmailHint)
      }

      for (const nestedKey of ["continueUrl", "continue_url", "link", "deep_link_id"]) {
        const nestedValue = parsed.searchParams.get(nestedKey)
        if (nestedValue) {
          urlsToInspect.push(nestedValue)
        }
      }
    } catch {
      // Ignore malformed URL segments and continue scanning fallbacks.
    }
  }

  return ""
}

function getFriendlyError(error: unknown) {
  const errorCode = getErrorCode(error)
  if (errorCode === "auth/invalid-action-code") {
    return "This sign-in link is invalid, expired, or already used. Request a new email link and paste it here before opening it in another browser."
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Something went wrong while handling the sign-in link."
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === "string") {
      return code
    }
  }

  return ""
}

export function useEmailLinkAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [emailInput, setEmailInput] = useState("")
  const [manualLinkInput, setManualLinkInput] = useState("")
  const [loading, setLoading] = useState(() => Boolean(firebaseAuth))
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [googleSigningIn, setGoogleSigningIn] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState(() => (firebaseAuth ? "" : AUTH_UNAVAILABLE_MESSAGE))
  const [isSignInLink, setIsSignInLink] = useState(false)
  const account = useUserProfile(user)

  const completeSignInFromLink = useCallback(async (signInUrl: string, preferredEmail = "") => {
    if (!firebaseAuth) {
      setErrorMessage(AUTH_UNAVAILABLE_MESSAGE)
      return false
    }

    if (typeof window === "undefined") {
      return false
    }

    const storedEmail = window.localStorage.getItem(PENDING_EMAIL_KEY) ?? ""
    const hintedEmail = parseEmailHintFromUrl(signInUrl)
    const emailToUse = preferredEmail.trim() || storedEmail || hintedEmail

    if (!emailToUse) {
      setStatusMessage("Enter the email address you used to request the link.")
      return false
    }

    setErrorMessage("")
    setEmailInput(emailToUse)
    setCompleting(true)

    try {
      await setPersistence(firebaseAuth, browserLocalPersistence)
      const credential = await signInWithEmailLink(firebaseAuth, emailToUse, signInUrl)
      window.localStorage.removeItem(PENDING_EMAIL_KEY)
      clearFirebaseAuthQueryParamsFromCurrentUrl()

      setUser(credential.user)
      setManualLinkInput("")
      setStatusMessage("")
      return true
    } catch (error) {
      setErrorMessage(getFriendlyError(error))
      return false
    } finally {
      setCompleting(false)
    }
  }, [])

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
        clearFirebaseAuthQueryParamsFromCurrentUrl()
      }
      setLoading(false)
    })

    const completeLinkIfPresent = async () => {
      if (typeof window === "undefined" || !firebaseAuth) {
        return
      }

      const currentUrl = window.location.href
      if (!isSignInWithEmailLink(firebaseAuth, currentUrl)) {
        setIsSignInLink(false)
        // Remove stale Firebase action params from old/used links.
        clearFirebaseAuthQueryParamsFromCurrentUrl()
        return
      }

      setIsSignInLink(true)
      await completeSignInFromLink(currentUrl)

      if (!isCancelled) {
        setLoading(false)
      }
    }

    const restoreGoogleRedirectResult = async () => {
      if (!firebaseAuth) {
        return
      }

      try {
        const redirectResult = await getRedirectResult(firebaseAuth)

        if (!redirectResult || isCancelled) {
          return
        }

        setUser(redirectResult.user)
        setStatusMessage("")
        setErrorMessage("")
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getFriendlyError(error))
        }
      }
    }

    void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {})
    void restoreGoogleRedirectResult()
    void completeLinkIfPresent()

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [completeSignInFromLink])

  async function submitGoogleSignIn() {
    if (!firebaseAuth) {
      setErrorMessage(AUTH_UNAVAILABLE_MESSAGE)
      return
    }

    setErrorMessage("")
    setStatusMessage("")
    setGoogleSigningIn(true)

    try {
      await setPersistence(firebaseAuth, browserLocalPersistence)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: "select_account"
      })

      await signInWithPopup(firebaseAuth, provider)
    } catch (error) {
      const errorCode = getErrorCode(error)
      const shouldUseRedirectFallback =
        errorCode === "auth/popup-blocked" ||
        errorCode === "auth/operation-not-supported-in-this-environment" ||
        errorCode === "auth/web-storage-unsupported"

      if (shouldUseRedirectFallback) {
        try {
          const provider = new GoogleAuthProvider()
          provider.setCustomParameters({
            prompt: "select_account"
          })
          await signInWithRedirect(firebaseAuth, provider)
          return
        } catch (redirectError) {
          setErrorMessage(getFriendlyError(redirectError))
          return
        }
      }

      setErrorMessage(getFriendlyError(error))
    } finally {
      setGoogleSigningIn(false)
    }
  }

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
      const actionUrl = new URL(`${window.location.origin}${window.location.pathname}`)
      actionUrl.searchParams.set("emailHint", encodeURIComponent(trimmedEmail))
      const actionCodeSettings = {
        url: actionUrl.toString(),
        handleCodeInApp: true
      }

      if (isSignInWithEmailLink(firebaseAuth, currentUrl)) {
        await completeSignInFromLink(currentUrl, trimmedEmail)
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

  async function submitManualSignInLink() {
    if (!firebaseAuth) {
      setErrorMessage(AUTH_UNAVAILABLE_MESSAGE)
      return
    }

    const trimmedLink = manualLinkInput.trim()
    if (!trimmedLink) {
      setErrorMessage("Paste the email sign-in link first.")
      return
    }

    setErrorMessage("")
    setStatusMessage("")

    const resolvedSignInLink = resolveEmailSignInLink(trimmedLink, firebaseAuth)
    if (!resolvedSignInLink) {
      setErrorMessage("That link does not look like a valid email sign-in link.")
      return
    }

    await completeSignInFromLink(resolvedSignInLink)
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
  }
}
