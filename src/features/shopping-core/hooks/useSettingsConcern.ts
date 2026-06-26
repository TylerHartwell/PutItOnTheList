import { useState } from "react"
import { vibrate } from "@/shared/utils/vibrate"
import { normalizeText } from "@/shared/utils/text"
import type { useUserLists } from "./useUserLists"

export type SettingsConcernParams = {
  userLists: ReturnType<typeof useUserLists>
}

export function useSettingsConcern({ userLists }: SettingsConcernParams) {
  const [currentListNameInput, setCurrentListNameInput] = useState("")
  const [newListNameInput, setNewListNameInput] = useState("")
  const [joinListIdInput, setJoinListIdInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  function openSettingsModal() {
    setCurrentListNameInput(userLists.storedLists.find(list => list.listId === userLists.currentListId)?.listName ?? "")
    setIsOpen(true)
    // prevent scrolling while modal is open
    document.body.style.overflow = "hidden"
  }

  function leaveList() {
    if (!userLists.currentListId) {
      return
    }

    if (!window.confirm("Leave this list? You can rejoin later using its list number.")) {
      return
    }

    void userLists.leaveList(userLists.currentListId)
    setIsOpen(false)
    vibrate()
  }

  async function joinList() {
    const listIdToJoin = joinListIdInput.trim()
    if (!listIdToJoin) {
      return
    }

    try {
      await userLists.joinList(listIdToJoin)
      setJoinListIdInput("")
      setIsOpen(false)
      vibrate()
    } catch {
      setJoinListIdInput("")
    }
  }

  async function createList() {
    const trimmedName = normalizeText(newListNameInput)
    await userLists.createList(trimmedName)
    setNewListNameInput("")
    setIsOpen(false)
    vibrate()
  }

  async function copyList() {
    if (!userLists.currentListId) {
      return false
    }

    try {
      await navigator.clipboard.writeText(userLists.currentListId)
      vibrate()
      return true
    } catch {
      window.alert("Could not copy list number. Please copy it manually.")
      return false
    }
  }

  async function editListName() {
    if (!userLists.currentListId) {
      return
    }

    const trimmedName = normalizeText(currentListNameInput)
    await userLists.renameList(userLists.currentListId, trimmedName)
    setIsOpen(false)
    vibrate()
  }

  async function removeMember(memberUid: string) {
    await userLists.removeMember(memberUid)
    vibrate()
  }

  async function transferOwnership(nextOwnerUid: string) {
    await userLists.transferOwnership(nextOwnerUid)
    vibrate()
  }

  return {
    currentListNameInput,
    setCurrentListNameInput,
    newListNameInput,
    setNewListNameInput,
    joinListIdInput,
    setJoinListIdInput,
    openSettingsModal,
    leaveList,
    joinList,
    createList,
    copyList,
    editListName,
    currentListMembers: userLists.currentListMembers,
    currentListOwnerUid: userLists.currentListOwnerUid,
    isCurrentUserOwner: userLists.isCurrentUserOwner,
    removeMember,
    transferOwnership,
    isOpen,
    setIsOpen
  }
}
