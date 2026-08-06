import { isSignInWithEmailLink, type Auth } from "firebase/auth"
import { decodeAmpersandEntity, normalizePastedLinkInput } from "@/shared/utils/text"
import { EMAIL_HINT_NESTED_LINK_QUERY_KEYS, FIREBASE_AUTH_QUERY_KEYS, NESTED_LINK_QUERY_KEYS } from "./useEmailLinkAuth.constants"

export function resolveEmailSignInLink(rawInput: string, auth: Auth) {
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

export function clearFirebaseAuthQueryParamsFromCurrentUrl() {
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

export function parseEmailHintFromUrl(rawUrl: string) {
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

      for (const nestedKey of EMAIL_HINT_NESTED_LINK_QUERY_KEYS) {
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
