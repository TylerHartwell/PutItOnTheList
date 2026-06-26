"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { get, onValue, ref, update } from "firebase/database"
import { type User } from "firebase/auth"
import { database } from "@/shared/lib/firebase"
import { normalizeText } from "@/shared/utils/text"
import type { ListMember, StoredList } from "@/shared/types/shopping"
import { loadLegacyListMetadataForAuthMigration } from "../utils/legacy-list-migration"

const LISTS_ROOT = "lists"

function generateListId(): string {
  const alphabet = "0123456789"
  const idLength = 8

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const randomBytes = new Uint8Array(idLength)
    crypto.getRandomValues(randomBytes)

    return Array.from(randomBytes, byte => alphabet[byte % alphabet.length]).join("")
  }

  return Array.from({ length: idLength }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("")
}

export function useUserLists(user: User | null, activeUsername: string) {
  const [storedLists, setStoredLists] = useState<StoredList[]>([])
  const [currentListId, setCurrentListId] = useState("")
  const [isLoading, setIsLoading] = useState(!!user)
  const [currentListMembers, setCurrentListMembers] = useState<ListMember[]>([])
  const [currentListOwnerUid, setCurrentListOwnerUid] = useState("")
  const [currentListLastEditedBy, setCurrentListLastEditedBy] = useState("")
  const [hasRunLegacyMigration, setHasRunLegacyMigration] = useState(false)
  const isBootstrappingDefaultListRef = useRef(false)
  const isCurrentUserOwner = Boolean(user?.uid && currentListOwnerUid && user.uid === currentListOwnerUid)

  const createList = useCallback(
    async (listName: string) => {
      if (!database || !user) {
        return
      }

      const db = database

      const newListId = generateListId()
      const trimmedName = normalizeText(listName)

      await update(ref(db), {
        [`${LISTS_ROOT}/${newListId}`]: {
          owner: user.uid,
          listName: trimmedName,
          lastEditedBy: activeUsername,
          members: {
            [user.uid]: true
          },
          memberProfiles: {
            [user.uid]: {
              username: activeUsername
            }
          }
        },
        [`users/${user.uid}/${LISTS_ROOT}/${newListId}`]: true
      })

      setCurrentListId(newListId)
    },
    [activeUsername, user]
  )

  const ensureDefaultList = useCallback(async () => {
    if (isBootstrappingDefaultListRef.current) {
      return
    }

    isBootstrappingDefaultListRef.current = true

    try {
      await createList("")
    } finally {
      isBootstrappingDefaultListRef.current = false
    }
  }, [createList])

  useEffect(() => {
    if (!database) {
      void Promise.resolve().then(() => {
        setStoredLists([])
        setCurrentListId("")
        setIsLoading(false)
      })
      return
    }

    if (!user) {
      void Promise.resolve().then(() => {
        setHasRunLegacyMigration(false)
      })
      return
    }

    if (!activeUsername || hasRunLegacyMigration) {
      return
    }

    const db = database

    let isCancelled = false

    const migrateLegacyLocalStorageLists = async () => {
      const { listIds, listNamesById } = loadLegacyListMetadataForAuthMigration()
      const legacyListIds = listIds.map(listId => listId.trim()).filter(Boolean)

      if (legacyListIds.length === 0) {
        if (!isCancelled) {
          setHasRunLegacyMigration(true)
        }
        return
      }

      for (const listId of legacyListIds) {
        if (isCancelled) {
          return
        }

        try {
          const listRef = ref(db, `${LISTS_ROOT}/${listId}`)
          const listSnapshot = await get(listRef)
          const localLegacyName = normalizeText(listNamesById[listId] ?? "")

          if (!listSnapshot.exists()) {
            // Create missing list metadata in a single write so it passes list create rules.
            await update(ref(db), {
              [`${LISTS_ROOT}/${listId}`]: {
                owner: user.uid,
                listName: localLegacyName,
                lastEditedBy: activeUsername,
                members: {
                  [user.uid]: true
                },
                memberProfiles: {
                  [user.uid]: {
                    username: activeUsername
                  }
                }
              },
              [`users/${user.uid}/${LISTS_ROOT}/${listId}`]: true
            })
            continue
          }

          const listValue = listSnapshot.val() as {
            owner?: unknown
            lastEditedBy?: unknown
            listName?: unknown
          }

          const migrationUpdates: Record<string, string | boolean> = {
            [`${LISTS_ROOT}/${listId}/members/${user.uid}`]: true,
            [`${LISTS_ROOT}/${listId}/memberProfiles/${user.uid}/username`]: activeUsername,
            [`users/${user.uid}/${LISTS_ROOT}/${listId}`]: true
          }

          if (typeof listValue.owner !== "string" || !listValue.owner.trim()) {
            migrationUpdates[`${LISTS_ROOT}/${listId}/owner`] = user.uid
          }

          if (typeof listValue.lastEditedBy !== "string" || !listValue.lastEditedBy.trim()) {
            migrationUpdates[`${LISTS_ROOT}/${listId}/lastEditedBy`] = activeUsername
          }

          if (localLegacyName && (typeof listValue.listName !== "string" || !listValue.listName.trim())) {
            migrationUpdates[`${LISTS_ROOT}/${listId}/listName`] = localLegacyName
          }

          await update(ref(db), migrationUpdates)
        } catch {
          // Keep migration best-effort and non-blocking.
        }
      }

      if (!isCancelled) {
        setHasRunLegacyMigration(true)
      }
    }

    void migrateLegacyLocalStorageLists()

    return () => {
      isCancelled = true
    }
  }, [activeUsername, hasRunLegacyMigration, user])

  useEffect(() => {
    if (!database || !user || !activeUsername || storedLists.length === 0) {
      return
    }

    const db = database

    const syncMemberProfiles = async () => {
      try {
        await Promise.all(
          storedLists.map(list =>
            update(ref(db), {
              [`${LISTS_ROOT}/${list.listId}/memberProfiles/${user.uid}/username`]: activeUsername
            })
          )
        )
      } catch {
        // Best effort sync to keep usernames fresh in list-scoped member profiles.
      }
    }

    void syncMemberProfiles()
  }, [activeUsername, storedLists, user])

  useEffect(() => {
    let isCancelled = false

    if (!database) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return
        }

        setStoredLists([])
        setCurrentListId("")
        setIsLoading(false)
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

        setStoredLists([])
        setCurrentListId("")
        setIsLoading(false)
      })

      return () => {
        isCancelled = true
      }
    }

    const db = database

    // Listen to the user's list references
    const userListsRef = ref(db, `users/${user.uid}/${LISTS_ROOT}`)

    const unsubscribe = onValue(
      userListsRef,
      snapshot => {
        if (isCancelled) {
          return
        }

        if (!snapshot.exists()) {
          setStoredLists([])
          setCurrentListId("")
          setIsLoading(true)

          void ensureDefaultList().catch(() => {
            if (!isCancelled) {
              setIsLoading(false)
            }
          })
          return
        }

        const userListIds = Object.keys(snapshot.val() as Record<string, true>)
        const listMetadataPromises = userListIds.map(async listId => {
          try {
            const listSnapshot = await get(ref(db, `${LISTS_ROOT}/${listId}`))
            if (!listSnapshot.exists()) {
              await update(ref(db), {
                [`users/${user.uid}/${LISTS_ROOT}/${listId}`]: null
              })
              return null
            }

            const listData = listSnapshot.val() as {
              listName?: unknown
              owner?: unknown
              lastEditedBy?: unknown
            }

            return {
              listId,
              listName: typeof listData?.listName === "string" ? listData.listName : "",
              ownerUid: typeof listData?.owner === "string" ? listData.owner : "",
              lastEditedBy: typeof listData?.lastEditedBy === "string" ? listData.lastEditedBy : ""
            } satisfies StoredList
          } catch {
            // If list metadata cannot be read (deleted/permission removed), clean up stale user index entry.
            await update(ref(db), {
              [`users/${user.uid}/${LISTS_ROOT}/${listId}`]: null
            })
            return null
          }
        })

        void Promise.all(listMetadataPromises).then(lists => {
          if (isCancelled) {
            return
          }

          const validLists = lists.filter((list): list is StoredList => list !== null)
          setStoredLists(validLists)

          setCurrentListId(previousListId => {
            if (previousListId && validLists.some(list => list.listId === previousListId)) {
              return previousListId
            }

            return validLists[0]?.listId ?? ""
          })

          setIsLoading(false)
        })
      },
      () => {
        if (isCancelled) {
          return
        }

        setStoredLists([])
        setCurrentListId("")
        setIsLoading(false)
      }
    )

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [ensureDefaultList, user])

  useEffect(() => {
    let isCancelled = false

    if (!database) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return
        }

        setCurrentListMembers([])
        setCurrentListOwnerUid("")
        setCurrentListLastEditedBy("")
      })

      return () => {
        isCancelled = true
      }
    }

    if (!user || !currentListId) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return
        }

        setCurrentListMembers([])
        setCurrentListOwnerUid("")
        setCurrentListLastEditedBy("")
      })

      return () => {
        isCancelled = true
      }
    }

    const db = database

    const currentListRef = ref(db, `${LISTS_ROOT}/${currentListId}`)

    const unsubscribe = onValue(currentListRef, snapshot => {
      if (isCancelled || !snapshot.exists()) {
        if (!isCancelled) {
          setCurrentListMembers([])
          setCurrentListOwnerUid("")
          setCurrentListLastEditedBy("")
        }
        return
      }

      const listData = snapshot.val() as {
        owner?: unknown
        members?: Record<string, unknown>
        memberProfiles?: Record<string, unknown>
        lastEditedBy?: unknown
      }

      const ownerUid = typeof listData?.owner === "string" ? listData.owner : ""
      const membersValue = (listData?.members as Record<string, unknown> | undefined) ?? {}
      const memberProfilesValue = (listData?.memberProfiles as Record<string, unknown> | undefined) ?? {}
      const memberUids = Object.entries(membersValue)
        .filter(([, value]) => value === true)
        .map(([memberUid]) => memberUid)

      setCurrentListOwnerUid(ownerUid)
      setCurrentListLastEditedBy(typeof listData?.lastEditedBy === "string" ? listData.lastEditedBy : "")

      const nextMembers = memberUids.map(memberUid => {
        const profile = memberProfilesValue[memberUid] as { username?: unknown } | undefined
        const profileUsername = typeof profile?.username === "string" ? profile.username.trim() : ""
        const username = profileUsername || (memberUid === user.uid && activeUsername ? activeUsername : memberUid)

        return {
          uid: memberUid,
          username
        } satisfies ListMember
      })

      setCurrentListMembers(nextMembers)

      const backfillUpdates: Record<string, string> = {}

      for (const memberUid of memberUids) {
        const profile = memberProfilesValue[memberUid] as { username?: unknown } | undefined
        const currentUsername = typeof profile?.username === "string" ? profile.username.trim() : ""
        const fallbackUsername = memberUid === user.uid && activeUsername ? activeUsername : memberUid

        if (!currentUsername || (memberUid === user.uid && activeUsername && currentUsername !== activeUsername)) {
          backfillUpdates[`${LISTS_ROOT}/${currentListId}/memberProfiles/${memberUid}/username`] = fallbackUsername
        }
      }

      if (Object.keys(backfillUpdates).length > 0) {
        void update(ref(db), backfillUpdates).catch(() => {})
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [activeUsername, currentListId, user])

  function makeListIdFirst(listId: string) {
    if (!user || !storedLists.some(list => list.listId === listId)) {
      return
    }

    setCurrentListId(listId)
  }

  async function leaveList(listIdToLeave: string) {
    if (!database || !user) {
      return
    }

    const db = database

    const otherMembers = currentListMembers.filter(member => member.uid !== user.uid)

    if (isCurrentUserOwner && otherMembers.length > 0) {
      await update(ref(db), {
        [`${LISTS_ROOT}/${listIdToLeave}/owner`]: otherMembers[0].uid,
        [`${LISTS_ROOT}/${listIdToLeave}/members/${user.uid}`]: null,
        [`${LISTS_ROOT}/${listIdToLeave}/memberProfiles/${user.uid}`]: null,
        [`users/${user.uid}/${LISTS_ROOT}/${listIdToLeave}`]: null
      })
    } else if (isCurrentUserOwner && otherMembers.length === 0) {
      await update(ref(db), {
        [`${LISTS_ROOT}/${listIdToLeave}`]: null,
        [`users/${user.uid}/${LISTS_ROOT}/${listIdToLeave}`]: null
      })

      if (listIdToLeave === currentListId) {
        const remainingLists = storedLists.filter(list => list.listId !== listIdToLeave)
        if (remainingLists.length > 0) {
          setCurrentListId(remainingLists[0].listId)
        } else {
          await ensureDefaultList()
        }
      }

      return
    } else {
      await update(ref(db), {
        [`${LISTS_ROOT}/${listIdToLeave}/members/${user.uid}`]: null,
        [`${LISTS_ROOT}/${listIdToLeave}/memberProfiles/${user.uid}`]: null,
        [`users/${user.uid}/${LISTS_ROOT}/${listIdToLeave}`]: null
      })
    }

    // If this was the current list, switch to another one
    if (listIdToLeave === currentListId) {
      const remainingLists = storedLists.filter(list => list.listId !== listIdToLeave)
      if (remainingLists.length > 0) {
        setCurrentListId(remainingLists[0].listId)
      } else {
        // Create a default list if none remain
        await ensureDefaultList()
      }
    }
  }

  async function renameList(listId: string, newName: string) {
    if (!database || !user) {
      return
    }

    const db = database

    const trimmedName = normalizeText(newName)
    await update(ref(db), {
      [`${LISTS_ROOT}/${listId}/listName`]: trimmedName
    })
  }

  async function joinList(listIdToJoin: string) {
    if (!database || !user) {
      return
    }

    const db = database

    // Check if user is already in this list
    if (storedLists.some(list => list.listId === listIdToJoin)) {
      return
    }

    await update(ref(db), {
      [`${LISTS_ROOT}/${listIdToJoin}/members/${user.uid}`]: true,
      [`${LISTS_ROOT}/${listIdToJoin}/memberProfiles/${user.uid}/username`]: activeUsername,
      [`users/${user.uid}/${LISTS_ROOT}/${listIdToJoin}`]: true
    })
  }

  async function removeMember(memberUid: string) {
    if (!database || !user || !currentListId || !isCurrentUserOwner || memberUid === currentListOwnerUid) {
      return
    }

    const db = database

    await update(ref(db), {
      [`${LISTS_ROOT}/${currentListId}/members/${memberUid}`]: null,
      [`${LISTS_ROOT}/${currentListId}/memberProfiles/${memberUid}`]: null
    })
  }

  async function transferOwnership(nextOwnerUid: string) {
    if (!database || !user || !currentListId || !isCurrentUserOwner) {
      return
    }

    const db = database

    if (!currentListMembers.some(member => member.uid === nextOwnerUid)) {
      return
    }

    await update(ref(db), {
      [`${LISTS_ROOT}/${currentListId}/owner`]: nextOwnerUid
    })
  }

  return {
    storedLists,
    currentListId,
    setCurrentListId,
    isLoading,
    currentListMembers,
    currentListOwnerUid,
    currentListLastEditedBy,
    isCurrentUserOwner,
    makeListIdFirst,
    createList,
    leaveList,
    renameList,
    joinList,
    removeMember,
    transferOwnership
  }
}
