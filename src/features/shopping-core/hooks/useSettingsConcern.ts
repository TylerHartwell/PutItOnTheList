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
  const [joinListIdInput, setJoinListIdInputState] = useState("")
  const [joinListError, setJoinListError] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  function changeCurrentListNameInput(value: string) {
    setCurrentListNameInput(value)
  }

  function openSettingsModal() {
    changeCurrentListNameInput(userLists.storedLists.find(list => list.listId === userLists.currentListId)?.listName ?? "")
    setJoinListError("")
    setIsOpen(true)
  }

  function setJoinListIdInput(value: string) {
    setJoinListIdInputState(value)
    if (joinListError) {
      setJoinListError("")
    }
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
      setJoinListError("Enter a list number.")
      return
    }

    try {
      await userLists.joinList(listIdToJoin)
      setJoinListIdInputState("")
      setJoinListError("")
      setIsOpen(false)
      vibrate()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not join that list right now."
      setJoinListError(errorMessage)
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
    changeCurrentListNameInput,
    newListNameInput,
    setNewListNameInput,
    joinListIdInput,
    setJoinListIdInput,
    joinListError,
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
