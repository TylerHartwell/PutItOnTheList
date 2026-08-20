"use client"

import { useEffect, type Dispatch, type SetStateAction } from "react"
import { database } from "@/shared/lib/firebase/config"
import { dbSubscribeToListById } from "@/shared/lib/firebase/profile"
import { dbSetListMemberUsername } from "@/shared/lib/firebase/list"
import type { ListMember } from "@/shared/types/shopping"

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
        }

        const ownerUid = typeof listData?.owner === "string" ? listData.owner : ""
        const membersValue = (listData?.members as Record<string, unknown> | undefined) ?? {}
        const memberProfilesValue = (listData?.memberProfiles as Record<string, unknown> | undefined) ?? {}
        const memberUids = Object.entries(membersValue)
          .filter(([, value]) => value === true)
          .map(([memberUid]) => memberUid)

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

        for (const memberUid of memberUids) {
          const profile = memberProfilesValue[memberUid] as { username?: unknown } | undefined
          const currentUsername = typeof profile?.username === "string" ? profile.username.trim() : ""

          if (memberUid === userId && activeUsername && currentUsername !== activeUsername) {
            void dbSetListMemberUsername(currentListId, memberUid, activeUsername)
          }
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
