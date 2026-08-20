"use client"

import { useEffect, useRef, useState } from "react"
import { database } from "@/shared/lib/firebase/config"
import { dbChangeListOwner, dbJoinList, dbLeaveList, dbRemoveListMember, dbRenameList, dbSetListMemberUsername } from "@/shared/lib/firebase/list"
import { dbSetUserCurrentListId } from "@/shared/lib/firebase/profile"
import type { ListMember, StoredList } from "@/shared/types/shopping"
import { useCurrentListMembersSync } from "./useUserLists/useCurrentListMembersSync"
import { useListCreation } from "./useUserLists/useListCreation"
import { useUserListIndexSync } from "./useUserLists/useUserListIndexSync"

export function useUserLists(userId: string, activeUsername: string) {
  const [storedLists, setStoredLists] = useState<StoredList[]>([])
  const [currentListId, setCurrentListId] = useState("")
  const [isLoading, setIsLoading] = useState(!!userId)
  const [currentListMembers, setCurrentListMembers] = useState<ListMember[]>([])
  const [currentListOwnerUid, setCurrentListOwnerUid] = useState("")
  const isBootstrappingDefaultListRef = useRef(false)
  const hasResolvedInitialCurrentListRef = useRef(false)

  const isCurrentUserOwner = Boolean(userId === currentListOwnerUid)
  const currentListLastEditedByUid = storedLists.find(list => list.listId === currentListId)?.lastEditedByUid || ""
  const currentListLastEditedByUsername = currentListMembers.find(member => member.uid === currentListLastEditedByUid)?.username || "Unknown"

  const { createList, ensureDefaultList } = useListCreation({
    userId,
    activeUsername,
    setCurrentListId,
    isBootstrappingDefaultListRef
  })

  useUserListIndexSync({
    userId,
    ensureDefaultList,
    setStoredLists,
    setCurrentListId,
    setIsLoading,
    hasResolvedInitialCurrentListRef
  })

  useCurrentListMembersSync({
    userId,
    activeUsername,
    currentListId,
    setCurrentListMembers,
    setCurrentListOwnerUid
  })

  useEffect(() => {
    async function updateCurrentListId() {
      if (!database || !userId || !hasResolvedInitialCurrentListRef.current) {
        return
      }

      try {
        await dbSetUserCurrentListId(userId, currentListId || null)
      } catch {
        // Keep list selection responsive even if preference persistence fails.
      }
    }

    void updateCurrentListId()
  }, [currentListId, userId])

  useEffect(() => {
    if (!database || !userId || !activeUsername || storedLists.length === 0) {
      return
    }

    const syncMemberProfiles = async () => {
      try {
        await Promise.all(storedLists.map(list => dbSetListMemberUsername(list.listId, userId, activeUsername)))
      } catch {
        // Best effort sync to keep usernames fresh in list-scoped member profiles.
      }
    }

    void syncMemberProfiles()
  }, [activeUsername, storedLists, userId])

  function makeListIdFirst(listId: string) {
    if (!userId || !storedLists.some(list => list.listId === listId)) {
      return
    }

    setCurrentListId(listId)
  }

  function getNextListIdAfterLeave(listIdToLeave: string) {
    return storedLists.find(list => list.listId !== listIdToLeave)?.listId ?? ""
  }

  async function updateSelectionAfterLeave(listIdToLeave: string) {
    if (currentListId !== listIdToLeave) {
      return
    }

    const nextListId = getNextListIdAfterLeave(listIdToLeave)

    if (nextListId) {
      setCurrentListId(nextListId)
      return
    }

    await createList("")
  }

  async function leaveList(listIdToLeave: string) {
    const memberUserIds = currentListMembers.map(member => member.uid)

    await dbLeaveList(listIdToLeave, userId, memberUserIds, currentListOwnerUid)

    await updateSelectionAfterLeave(listIdToLeave)
  }

  async function renameList(listId: string, newName: string) {
    await dbRenameList(listId, userId, newName)

    setStoredLists(previousLists =>
      previousLists.map(list => {
        if (list.listId !== listId) {
          return list
        }

        return {
          ...list,
          listName: newName,
          lastEditedByUid: userId
        }
      })
    )
  }

  async function joinList(listId: string) {
    if (storedLists.some(list => list.listId === listId)) {
      setCurrentListId(listId)
      return
    }

    const joinedListId = await dbJoinList(listId, userId, activeUsername)

    if (joinedListId) {
      setCurrentListId(joinedListId)
    }
  }

  async function removeMember(memberUserId: string) {
    if (!isCurrentUserOwner || memberUserId === currentListOwnerUid) {
      return
    }

    await dbRemoveListMember(currentListId, memberUserId)
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
