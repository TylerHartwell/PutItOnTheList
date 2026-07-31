"use client"

import { useEffect, type Dispatch, type SetStateAction } from "react"
import { database } from "@/shared/lib/firebase/config"
import { dbBackfillListFields, dbSubscribeToListById } from "@/shared/lib/firebase/functions"
import type { ListMember } from "@/shared/types/shopping"
import { findUidForUsername } from "./helpers"

type UseCurrentListMembersSyncParams = {
  userId: string
  activeUsername: string
  currentListId: string
  setCurrentListMembers: Dispatch<SetStateAction<ListMember[]>>
  setCurrentListOwnerUid: Dispatch<SetStateAction<string>>
}

export function useCurrentListMembersSync({
  userId,
  activeUsername,
  currentListId,
  setCurrentListMembers,
  setCurrentListOwnerUid
}: UseCurrentListMembersSyncParams) {
  useEffect(() => {
    let isCancelled = false

    if (!database || !userId || !currentListId) {
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

    const unsubscribe = dbSubscribeToListById(
      currentListId,
      snapshot => {
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

          if (memberUid === userId && activeUsername && currentUsername !== activeUsername) {
            backfillUpdates[`lists/${currentListId}/memberProfiles/${memberUid}/username`] = activeUsername
          }
        }

        if (Object.keys(backfillUpdates).length > 0) {
          void dbBackfillListFields(currentListId, backfillUpdates).catch(() => {})
        }
      },
      () => {
        if (isCancelled) {
          return
        }

        setCurrentListMembers([])
        setCurrentListOwnerUid("")
      }
    )

    return () => {
      isCancelled = true
      unsubscribe?.()
    }
  }, [activeUsername, currentListId, setCurrentListMembers, setCurrentListOwnerUid, userId])
}
