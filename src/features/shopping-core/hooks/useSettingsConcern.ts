import { useState } from "react"
import { vibrate } from "@/shared/utils/vibrate"
import { trimAndCollapseSpaces } from "@/shared/utils/text"
import type { useUserLists } from "./useUserLists"

export type SettingsConcernParams = {
  userLists: ReturnType<typeof useUserLists>
}

export function useSettingsConcern({ userLists }: SettingsConcernParams) {
  const [isOpen, setIsOpen] = useState(false)
  const [newListNameInput, setNewListNameInput] = useState("")
  const [joinListIdInput, setJoinListIdInput] = useState("")
  const [joinListError, setJoinListError] = useState("")
  const currentListName = userLists.storedLists.find(list => list.listId === userLists.currentListId)?.listName ?? ""

  const [currentListNameInput, setCurrentListNameInput] = useState(currentListName)

  function reset() {
    setCurrentListNameInput(currentListName)
    setNewListNameInput("")
    setJoinListIdInput("")
    setJoinListError("")
  }

  function openSettingsModal() {
    setIsOpen(true)
    reset()
  }

  function closeSettingsModal() {
    reset()
    setIsOpen(false)
  }

  function changeCurrentListNameInput(value: string) {
    setCurrentListNameInput(value)
  }

  function changeNewListNameInput(value: string) {
    setNewListNameInput(value)
  }

  function changeJoinListIdInput(value: string) {
    setJoinListIdInput(value)
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
    closeSettingsModal()
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
      closeSettingsModal()
      vibrate()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not join that list right now."
      setJoinListError(errorMessage)
    }
  }

  async function createList() {
    const trimmedName = trimAndCollapseSpaces(newListNameInput)
    await userLists.createList(trimmedName)

    closeSettingsModal()
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

    const trimmedName = trimAndCollapseSpaces(currentListNameInput)
    await userLists.renameList(userLists.currentListId, trimmedName)
    closeSettingsModal()
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
    isOpen,
    openSettingsModal,
    closeSettingsModal,
    currentListNameInput,
    changeCurrentListNameInput,
    newListNameInput,
    changeNewListNameInput,
    joinListIdInput,
    changeJoinListIdInput,
    joinListError,
    leaveList,
    joinList,
    createList,
    copyList,
    editListName,
    currentListMembers: userLists.currentListMembers,
    currentListOwnerUid: userLists.currentListOwnerUid,
    isCurrentUserOwner: userLists.isCurrentUserOwner,
    removeMember,
    transferOwnership
  }
}
