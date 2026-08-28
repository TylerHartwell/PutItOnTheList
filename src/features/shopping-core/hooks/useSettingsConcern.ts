import { useState } from "react"
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
  const [currentListNameError, setCurrentListNameError] = useState("")
  const currentListName = userLists.storedLists.find(list => list.listId === userLists.currentListId)?.listName ?? ""
  const currentListNickname = userLists.storedLists.find(list => list.listId === userLists.currentListId)?.customName ?? ""

  const [currentListNameInput, setCurrentListNameInput] = useState(currentListName)
  const [currentListNicknameInput, setCurrentListNicknameInput] = useState(currentListNickname)

  function reset() {
    setCurrentListNameInput(currentListName)
    setCurrentListNameError("")
    setCurrentListNicknameInput(currentListNickname)
    setNewListNameInput("")
    setJoinListIdInput("")
    setJoinListError("")
  }

  function openSettingsModal() {
    setIsOpen(true)
    reset()
  }

  function closeSettingsModal() {
    setIsOpen(false)
  }

  function changeCurrentListNameInput(value: string) {
    setCurrentListNameInput(value)
    if (currentListNameError) {
      setCurrentListNameError("")
    }
  }

  function changeNewListNameInput(value: string) {
    setNewListNameInput(value)
  }

  function changeCurrentListNicknameInput(value: string) {
    setCurrentListNicknameInput(value)
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

    const listWillBeDeleted = userLists.isCurrentUserOwner && userLists.currentListMembers.length <= 1
    const confirmMessage = listWillBeDeleted
      ? "Leave this list? You are the last member, so this list will be deleted."
      : "Leave this list? You can rejoin later using its list number."

    if (!window.confirm(confirmMessage)) {
      return
    }

    void userLists.leaveList(userLists.currentListId)
    closeSettingsModal()
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not join that list right now."
      setJoinListError(errorMessage)
    }
  }

  async function createList() {
    const trimmedName = trimAndCollapseSpaces(newListNameInput)
    await userLists.createList(trimmedName)

    closeSettingsModal()
  }

  async function copyList() {
    if (!userLists.currentListId) {
      return false
    }

    try {
      await navigator.clipboard.writeText(userLists.currentListId)
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
    if (!trimmedName) {
      setCurrentListNameError("Enter a list name.")
      return
    }

    await userLists.renameList(userLists.currentListId, trimmedName)
    closeSettingsModal()
  }

  async function saveCurrentListNickname() {
    if (!userLists.currentListId) {
      return
    }

    const trimmedNickname = trimAndCollapseSpaces(currentListNicknameInput)
    await userLists.setListNickname(userLists.currentListId, trimmedNickname)
    closeSettingsModal()
  }

  async function removeMember(memberUid: string) {
    await userLists.removeMember(memberUid)
  }

  async function transferOwnership(nextOwnerUid: string) {
    await userLists.transferOwnership(nextOwnerUid)
  }

  return {
    isOpen,
    openSettingsModal,
    closeSettingsModal,
    currentListNameInput,
    changeCurrentListNameInput,
    currentListNameError,
    currentListNicknameInput,
    changeCurrentListNicknameInput,
    saveCurrentListNickname,
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
