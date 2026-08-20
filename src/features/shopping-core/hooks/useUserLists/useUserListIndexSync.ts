"use client"

import { useEffect, type Dispatch, type SetStateAction } from "react"
import { database } from "@/shared/lib/firebase/config"
import { dbClearUserListMembership } from "@/shared/lib/firebase/list"
import { dbGetListById, dbGetUserCurrentListId, dbSubscribeToUserListIds } from "@/shared/lib/firebase/profile"
import type { StoredList } from "@/shared/types/shopping"

type BooleanRef = { current: boolean }

type UseUserListIndexSyncParams = {
  userId: string
  ensureDefaultList: () => Promise<void>
  setStoredLists: Dispatch<SetStateAction<StoredList[]>>
  setCurrentListId: Dispatch<SetStateAction<string>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
  hasResolvedInitialCurrentListRef: BooleanRef
}

export function useUserListIndexSync({
  userId,
  ensureDefaultList,
  setStoredLists,
  setCurrentListId,
  setIsLoading,
  hasResolvedInitialCurrentListRef
}: UseUserListIndexSyncParams) {
  useEffect(() => {
    let isCancelled = false

    if (!database || !userId) {
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

    const unsubscribe = dbSubscribeToUserListIds(
      userId,
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
            const listSnapshot = await dbGetListById(listId)
            if (!listSnapshot) {
              return null
            }

            if (!listSnapshot.exists()) {
              await dbClearUserListMembership(userId, listId)
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
            await dbClearUserListMembership(userId, listId)
            return null
          }
        })

        const persistedCurrentListPromise = dbGetUserCurrentListId(userId)

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
      unsubscribe?.()
    }
  }, [ensureDefaultList, hasResolvedInitialCurrentListRef, setCurrentListId, setIsLoading, setStoredLists, userId])
}
