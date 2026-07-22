"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { get, onValue, ref, runTransaction, update } from "firebase/database"
import { type User } from "firebase/auth"
import { database } from "@/shared/lib/firebase/config"
import { trimAndCollapseSpaces } from "@/shared/utils/text"
import type { ListMember, StoredList } from "@/shared/types/shopping"
import { dbChangeListOwner, dbJoinList, dbLeaveList, dbRemoveListMember, dbRenameList } from "@/shared/lib/firebase/functions"

const MAX_CREATE_LIST_ATTEMPTS = 10

function normalizeUsernameCandidate(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function findUidForUsername(memberProfilesValue: Record<string, unknown>, fallbackMemberUids: string[], usernameCandidate: string): string {
  const normalizedCandidate = normalizeUsernameCandidate(usernameCandidate)
  if (!normalizedCandidate) {
    return ""
  }

  const uidSet = new Set<string>([...Object.keys(memberProfilesValue), ...fallbackMemberUids])

  for (const memberUid of uidSet) {
    const memberProfile = memberProfilesValue[memberUid] as { username?: unknown } | undefined
    const normalizedProfileUsername = normalizeUsernameCandidate(memberProfile?.username)
    if (normalizedProfileUsername && normalizedProfileUsername === normalizedCandidate) {
      return memberUid
    }
  }

  return ""
}

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
  const isBootstrappingDefaultListRef = useRef(false)
  const hasResolvedInitialCurrentListRef = useRef(false)
  const isCurrentUserOwner = Boolean(user?.uid === currentListOwnerUid)
  const currentListLastEditedByUsername = currentListMembers.find(member => member.uid === currentListOwnerUid)?.username || "Unknown"

  const editorUid = user?.uid || ""

  useEffect(() => {
    async function updateCurrentListId() {
      if (!database || !user || !hasResolvedInitialCurrentListRef.current) {
        return
      }

      try {
        await update(ref(database), {
          [`users/${user.uid}/currentListId`]: currentListId || null
        })
      } catch {
        // Keep list selection responsive even if preference persistence fails.
      }
    }

    void updateCurrentListId()
  }, [currentListId, user])

  const createList = useCallback(
    async (listName: string) => {
      if (!database || !user) {
        return
      }

      const db = database
      const trimmedName = trimAndCollapseSpaces(listName)

      const listRecord = {
        owner: user.uid,
        listName: trimmedName,
        lastEditedByUid: user.uid,
        members: {
          [user.uid]: true
        },
        memberProfiles: {
          [user.uid]: {
            username: activeUsername
          }
        }
      }

      let newListId = ""

      for (let attempt = 0; attempt < MAX_CREATE_LIST_ATTEMPTS; attempt += 1) {
        const candidateListId = generateListId()
        const reservationResult = await runTransaction(ref(db, `lists/${candidateListId}`), currentValue => {
          if (currentValue !== null) {
            return
          }

          return listRecord
        })

        if (reservationResult.committed) {
          newListId = candidateListId
          break
        }
      }

      if (!newListId) {
        throw new Error("Could not reserve a unique list ID. Please try again.")
      }

      try {
        await update(ref(db), {
          [`users/${user.uid}/lists/${newListId}`]: true
        })
      } catch (error) {
        await update(ref(db), {
          [`lists/${newListId}`]: null
        })

        throw error
      }

      setCurrentListId(newListId)
    },
    [user, activeUsername, setCurrentListId]
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
    if (!database || !user || !activeUsername || storedLists.length === 0) {
      return
    }

    const db = database

    const syncMemberProfiles = async () => {
      try {
        await Promise.all(
          storedLists.map(list =>
            update(ref(db), {
              [`lists/${list.listId}/memberProfiles/${user.uid}/username`]: activeUsername
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

    if (!database || !user) {
      hasResolvedInitialCurrentListRef.current = false
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
    const userListsRef = ref(db, `users/${user.uid}/lists`)

    const unsubscribe = onValue(
      userListsRef,
      snapshot => {
        if (isCancelled) {
          return
        }

        if (!snapshot.exists()) {
          hasResolvedInitialCurrentListRef.current = false
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
            const listSnapshot = await get(ref(db, `lists/${listId}`))
            if (!listSnapshot.exists()) {
              await update(ref(db), {
                [`users/${user.uid}/lists/${listId}`]: null
              })
              return null
            }

            const listData = listSnapshot.val() as {
              listName?: unknown
              owner?: unknown
              lastEditedByUid?: unknown
            }

            return {
              listId,
              listName: typeof listData?.listName === "string" ? listData.listName : "",
              ownerUid: typeof listData?.owner === "string" ? listData.owner : "",
              lastEditedByUid: typeof listData?.lastEditedByUid === "string" ? listData.lastEditedByUid : ""
            } satisfies StoredList
          } catch {
            // If list metadata cannot be read (deleted/permission removed), clean up stale user index entry.
            await update(ref(db), {
              [`users/${user.uid}/lists/${listId}`]: null
            })
            return null
          }
        })

        const persistedCurrentListPromise = get(ref(db, `users/${user.uid}/currentListId`))
          .then(currentListSnapshot => {
            if (!currentListSnapshot.exists()) {
              return ""
            }

            const persistedListIdValue = currentListSnapshot.val()
            return typeof persistedListIdValue === "string" ? persistedListIdValue : ""
          })
          .catch(() => "")

        void Promise.all([Promise.all(listMetadataPromises), persistedCurrentListPromise]).then(([lists, persistedCurrentListId]) => {
          if (isCancelled) {
            return
          }

          const validLists = lists.filter((list): list is StoredList => list !== null)
          setStoredLists(validLists)

          setCurrentListId(previousListId => {
            if (previousListId && validLists.some(list => list.listId === previousListId)) {
              return previousListId
            }

            if (persistedCurrentListId && validLists.some(list => list.listId === persistedCurrentListId)) {
              return persistedCurrentListId
            }

            return validLists[0]?.listId ?? ""
          })

          hasResolvedInitialCurrentListRef.current = true
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
  }, [ensureDefaultList, setCurrentListId, user])

  useEffect(() => {
    let isCancelled = false

    if (!database || !user || !currentListId) {
      Promise.resolve().then(() => {
        if (isCancelled) {
          return
        }

        setCurrentListMembers([])
        setCurrentListOwnerUid("")
      })

      return () => {
        isCancelled = true
      }
    }

    const db = database

    const currentListRef = ref(db, `lists/${currentListId}`)

    const unsubscribe = onValue(currentListRef, snapshot => {
      if (isCancelled || !snapshot.exists()) {
        if (!isCancelled) {
          setCurrentListMembers([])
          setCurrentListOwnerUid("")
        }
        return
      }

      const listData = snapshot.val() as {
        owner?: unknown
        members?: Record<string, unknown>
        memberProfiles?: Record<string, unknown>
        lastEditedByUid?: unknown
        lastEditedBy?: unknown
        items?: Record<string, unknown>
      }

      const ownerUid = typeof listData?.owner === "string" ? listData.owner : ""
      const membersValue = (listData?.members as Record<string, unknown> | undefined) ?? {}
      const memberProfilesValue = (listData?.memberProfiles as Record<string, unknown> | undefined) ?? {}
      const itemsValue = (listData?.items as Record<string, unknown> | undefined) ?? {}
      const lastEditedByUid = typeof listData?.lastEditedByUid === "string" ? listData.lastEditedByUid : ""
      //TODO: Remove legacy lastEditedBy once all lists have been backfilled to lastEditedByUid
      const legacyLastEditedBy = typeof listData?.lastEditedBy === "string" ? listData.lastEditedBy : ""
      const memberUids = Object.entries(membersValue)
        .filter(([, value]) => value === true)
        .map(([memberUid]) => memberUid)

      const matchedLegacyLastEditorUid = findUidForUsername(memberProfilesValue, memberUids, legacyLastEditedBy)

      setCurrentListOwnerUid(ownerUid)

      const nextMembers = memberUids.map(memberUid => {
        const profile = memberProfilesValue[memberUid] as { username?: unknown } | undefined
        const profileUsername = typeof profile?.username === "string" ? profile.username.trim() : ""
        const username = profileUsername || "Unknown"

        return {
          uid: memberUid,
          username
        } satisfies ListMember
      })

      setCurrentListMembers(nextMembers)

      const backfillUpdates: Record<string, string | null> = {}

      if (!lastEditedByUid && matchedLegacyLastEditorUid) {
        backfillUpdates[`lists/${currentListId}/lastEditedByUid`] = matchedLegacyLastEditorUid
        backfillUpdates[`lists/${currentListId}/lastEditedBy`] = null
      }

      for (const [itemId, itemValue] of Object.entries(itemsValue)) {
        if (typeof itemValue !== "object" || itemValue === null || Array.isArray(itemValue)) {
          continue
        }

        const item = itemValue as { lastEditedByUid?: unknown; lastEditedBy?: unknown }
        const itemLastEditedByUid = typeof item.lastEditedByUid === "string" ? item.lastEditedByUid : ""
        const itemLegacyLastEditedBy = typeof item.lastEditedBy === "string" ? item.lastEditedBy : ""

        if (itemLastEditedByUid || !itemLegacyLastEditedBy) {
          continue
        }

        const matchedItemEditorUid = findUidForUsername(memberProfilesValue, memberUids, itemLegacyLastEditedBy)
        if (!matchedItemEditorUid) {
          continue
        }

        backfillUpdates[`lists/${currentListId}/items/${itemId}/lastEditedByUid`] = matchedItemEditorUid
        backfillUpdates[`lists/${currentListId}/items/${itemId}/lastEditedBy`] = null
      }

      for (const memberUid of memberUids) {
        const profile = memberProfilesValue[memberUid] as { username?: unknown } | undefined
        const currentUsername = typeof profile?.username === "string" ? profile.username.trim() : ""

        if (memberUid === user.uid && activeUsername && currentUsername !== activeUsername) {
          backfillUpdates[`lists/${currentListId}/memberProfiles/${memberUid}/username`] = activeUsername
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
    const memberUserIds = currentListMembers.map(member => member.uid)

    await dbLeaveList(currentListId, editorUid, memberUserIds, currentListOwnerUid)

    if (currentListId === listIdToLeave) {
      const remainingLists = storedLists.filter(list => list.listId !== listIdToLeave)
      if (remainingLists.length > 0) {
        setCurrentListId(remainingLists[0].listId)
      } else {
        await createList("")
      }
    }
  }

  async function renameList(listId: string, newName: string) {
    await dbRenameList(listId, editorUid, newName)

    setStoredLists(previousLists =>
      previousLists.map(list => {
        if (list.listId !== listId) {
          return list
        }

        return {
          ...list,
          listName: newName,
          lastEditedByUid: editorUid
        }
      })
    )
  }

  async function joinList(listId: string) {
    if (storedLists.some(list => list.listId === listId)) {
      setCurrentListId(listId)
      return
    }

    const joinedListId = await dbJoinList(listId, editorUid, activeUsername)

    if (joinedListId) {
      setCurrentListId(joinedListId)
    }
  }

  async function removeMember(userId: string) {
    if (!isCurrentUserOwner || userId === currentListOwnerUid) {
      return
    }

    await dbRemoveListMember(currentListId, userId)
  }

  async function transferOwnership(nextOwnerUid: string) {
    if (!isCurrentUserOwner) {
      return
    }

    const memberUserIds = currentListMembers.map(member => member.uid)

    await dbChangeListOwner(nextOwnerUid, currentListId, memberUserIds)
  }

  return {
    storedLists,
    currentListId,
    isLoading,
    currentListMembers,
    currentListOwnerUid,
    isCurrentUserOwner,
    currentListLastEditedByUsername,
    makeListIdFirst,
    createList,
    leaveList,
    renameList,
    joinList,
    removeMember,
    transferOwnership
  }
}
