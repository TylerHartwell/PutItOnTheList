"use client"

import { useEffect, useState } from "react"
import { updateProfile, type User } from "firebase/auth"
import { get, onValue, ref, remove, runTransaction, update } from "firebase/database"
import { database } from "@/shared/lib/firebase/config"
import type { UserAccountState, UserProfileRecord } from "@/shared/types/user"

const USERS_ROOT = "users"
const USERNAMES_ROOT = "usernames"
const USERNAME_PATTERN = /^[a-z0-9_]{6,18}$/

function canonicalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function getUsernameValidationError(username: string) {
  if (!username) {
    return "Enter a username before saving account settings."
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Use 6-18 characters with lowercase letters, numbers, or underscores."
  }

  return ""
}

function usernameToKey(username: string) {
  const normalized = canonicalizeUsername(username)
  return Array.from(normalized)
    .map(character => character.codePointAt(0)?.toString(16) ?? "")
    .join("_")
}

function getFriendlyError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return "Something went wrong while saving your account settings."
}

function getDatabaseUnavailableError() {
  return "Firebase database is not configured. Set NEXT_PUBLIC_FIREBASE_DATABASE_URL in Netlify and redeploy."
}

function buildProfileSnapshot(user: User, rawProfile: Partial<UserProfileRecord> | null): UserProfileRecord {
  const now = Date.now()
  const persistedUsername = typeof rawProfile?.username === "string" ? canonicalizeUsername(rawProfile.username) : ""

  return {
    uid: user.uid,
    email: user.email ?? rawProfile?.email ?? "",
    username: persistedUsername,
    createdAt: typeof rawProfile?.createdAt === "number" ? rawProfile.createdAt : now,
    updatedAt: typeof rawProfile?.updatedAt === "number" ? rawProfile.updatedAt : now
  }
}

export function useUserProfile(user: User | null): UserAccountState {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [requiresUsernameSetup, setRequiresUsernameSetup] = useState(Boolean(user))
  const [usernameInput, setUsernameInput] = useState("")
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const usernameCandidate = canonicalizeUsername(usernameInput)
  const usernameValidationMessage = usernameCandidate ? getUsernameValidationError(usernameCandidate) : ""

  useEffect(() => {
    let isCancelled = false

    if (!database) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return
        }

        setProfile(null)
        setIsLoading(false)
        setRequiresUsernameSetup(Boolean(user))
        setErrorMessage(getDatabaseUnavailableError())
      })

      return () => {
        isCancelled = true
      }
    }

    if (!user) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return
        }

        setProfile(null)
        setIsLoading(false)
        setRequiresUsernameSetup(false)
        setUsernameInput("")
        setIsSavingUsername(false)
        setStatusMessage("")
        setErrorMessage("")
      })

      return () => {
        isCancelled = true
      }
    }

    void Promise.resolve().then(() => {
      if (!isCancelled) {
        setIsLoading(true)
        setRequiresUsernameSetup(true)
      }
    })

    const db = database

    const profileRef = ref(db, `${USERS_ROOT}/${user.uid}`)

    const resolveUsernameSetupRequirement = async (nextProfile: UserProfileRecord) => {
      const normalizedUsername = canonicalizeUsername(nextProfile.username)
      const normalizedEmail = canonicalizeUsername(nextProfile.email)

      if (!normalizedUsername || normalizedUsername === normalizedEmail || getUsernameValidationError(normalizedUsername)) {
        if (!isCancelled) {
          setRequiresUsernameSetup(true)
          setIsLoading(false)
        }
        return
      }

      try {
        const usernameRef = ref(db, `${USERNAMES_ROOT}/${usernameToKey(normalizedUsername)}`)
        const usernameClaimSnapshot = await get(usernameRef)

        if (isCancelled) {
          return
        }

        const hasUniqueUsername = usernameClaimSnapshot.exists() && usernameClaimSnapshot.val() === user.uid
        setRequiresUsernameSetup(!hasUniqueUsername)
      } catch {
        if (isCancelled) {
          return
        }

        setRequiresUsernameSetup(true)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    const unsubscribe = onValue(
      profileRef,
      snapshot => {
        if (isCancelled) {
          return
        }

        const rawProfile = snapshot.exists() ? (snapshot.val() as Partial<UserProfileRecord>) : null
        const nextProfile = buildProfileSnapshot(user, rawProfile)

        setProfile(nextProfile)
        setUsernameInput(nextProfile.username)
        setStatusMessage("")
        setErrorMessage("")

        if (snapshot.exists()) {
          const nextProfileUpdate: Partial<UserProfileRecord> = {}

          if (rawProfile?.email !== nextProfile.email) {
            nextProfileUpdate.email = nextProfile.email
          }

          if (rawProfile?.uid !== nextProfile.uid) {
            nextProfileUpdate.uid = nextProfile.uid
          }

          if (rawProfile?.username !== nextProfile.username && nextProfile.username) {
            nextProfileUpdate.username = nextProfile.username
          }

          if (typeof rawProfile?.createdAt !== "number") {
            nextProfileUpdate.createdAt = nextProfile.createdAt
          }

          if (Object.keys(nextProfileUpdate).length > 0) {
            void update(profileRef, {
              ...nextProfileUpdate,
              updatedAt: nextProfile.updatedAt
            })
          }
        }

        void resolveUsernameSetupRequirement(nextProfile)
      },
      error => {
        if (isCancelled) {
          return
        }

        setErrorMessage(getFriendlyError(error))
        setRequiresUsernameSetup(true)
        setIsLoading(false)
      }
    )

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [user])

  async function saveUsername() {
    if (!user) {
      setErrorMessage("Sign in first before saving account settings.")
      return
    }

    if (!database) {
      setErrorMessage(getDatabaseUnavailableError())
      return
    }

    const db = database

    const typedUsername = usernameInput.trim()
    const resolvedUsername = canonicalizeUsername(typedUsername)
    const usernameValidationError = getUsernameValidationError(resolvedUsername)

    if (usernameValidationError) {
      setErrorMessage(usernameValidationError)
      return
    }

    const nextUsernameKey = usernameToKey(resolvedUsername)
    const previousUsername = profile?.username ?? ""
    const previousUsernameKey = previousUsername ? usernameToKey(previousUsername) : ""
    const nextUpdatedAt = Date.now()

    setErrorMessage("")
    setStatusMessage("")
    setIsSavingUsername(true)

    try {
      const nextUsernameRef = ref(db, `${USERNAMES_ROOT}/${nextUsernameKey}`)
      const usernameClaimResult = await runTransaction(nextUsernameRef, currentValue => {
        if (currentValue === null || currentValue === user.uid) {
          return user.uid
        }

        return
      })

      if (!usernameClaimResult.committed) {
        setErrorMessage("That username is already taken.")
        return
      }

      const profileRef = ref(db, `${USERS_ROOT}/${user.uid}`)
      try {
        await update(profileRef, {
          uid: user.uid,
          email: user.email ?? profile?.email ?? "",
          username: resolvedUsername,
          createdAt: profile?.createdAt ?? nextUpdatedAt,
          updatedAt: nextUpdatedAt
        })
      } catch (error) {
        // Release newly claimed username if profile persistence fails.
        try {
          const releaseClaimResult = await runTransaction(nextUsernameRef, currentValue => {
            if (currentValue === user.uid) {
              return null
            }

            return currentValue
          })

          if (releaseClaimResult.committed && releaseClaimResult.snapshot.val() === null) {
            await remove(nextUsernameRef)
          }
        } catch {
          // Keep original failure as the surfaced error.
        }

        throw error
      }

      // Keep username save successful even if displayName update fails.
      await updateProfile(user, {
        displayName: resolvedUsername
      }).catch(() => {})

      setUsernameInput(resolvedUsername)

      if (previousUsernameKey && previousUsernameKey !== nextUsernameKey) {
        const previousUsernameRef = ref(db, `${USERNAMES_ROOT}/${previousUsernameKey}`)
        const releaseResult = await runTransaction(previousUsernameRef, currentValue => {
          if (currentValue === user.uid) {
            return null
          }

          return currentValue
        })

        if (releaseResult.committed && releaseResult.snapshot.val() === null) {
          await remove(previousUsernameRef)
        }
      }

      setProfile(currentProfile =>
        currentProfile
          ? {
              ...currentProfile,
              email: user.email ?? currentProfile.email,
              username: resolvedUsername,
              updatedAt: nextUpdatedAt
            }
          : currentProfile
      )
      setRequiresUsernameSetup(false)
      setStatusMessage("Username saved.")
    } catch (error) {
      setErrorMessage(getFriendlyError(error))
    } finally {
      setIsSavingUsername(false)
    }
  }

  return {
    profile,
    isLoading,
    requiresUsernameSetup,
    usernameInput,
    setUsernameInput,
    usernameValidationMessage,
    isSavingUsername,
    statusMessage,
    errorMessage,
    saveUsername
  }
}
