import { useState } from "react"
import { child, get, getDatabase, ref } from "firebase/database"
import { normalizeText, vibrate } from "../lib/text"
import type { ListNames } from "./useListsConcern"

export type SettingsConcernParams = {
  currentListId: string
  listIds: string[]
  listNames: ListNames
  setCurrentListId: (value: string) => void
  persistAndSetLists: (nextListIds: string[], nextListNames: ListNames) => void
  makeListIdFirst: (listId: string) => void
}

export function useSettingsConcern({
  currentListId,
  listIds,
  listNames,
  setCurrentListId,
  persistAndSetLists,
  makeListIdFirst
}: SettingsConcernParams) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentListNameInput, setCurrentListNameInput] = useState("")
  const [newListNameInput, setNewListNameInput] = useState("")
  const [joinListIdInput, setJoinListIdInput] = useState("")

  function openSettingsModal() {
    setCurrentListNameInput(listNames[currentListId] ?? "")
    setIsSettingsOpen(true)
  }

  function closeSettingsModal() {
    setIsSettingsOpen(false)
  }

  function leaveList() {
    if (!currentListId) {
      return
    }

    const confirmed = window.confirm("Leave this list? You can rejoin later using its list number.")
    if (!confirmed) {
      return
    }

    const remainingListIds = listIds.filter(id => id !== currentListId)
    const nextListIds = remainingListIds.length > 0 ? remainingListIds : [String(Date.now())]
    const nextListNames: ListNames = {}

    for (const id of nextListIds) {
      if (listNames[id]) {
        nextListNames[id] = listNames[id]
      }
    }

    persistAndSetLists(nextListIds, nextListNames)
    setCurrentListId(nextListIds[0])
    closeSettingsModal()
    vibrate()
  }

  async function joinList() {
    const listIdToJoin = joinListIdInput.trim()
    if (!listIdToJoin) {
      return
    }

    try {
      const dbRef = ref(getDatabase())
      const snapshot = await get(child(dbRef, listIdToJoin))
      if (!snapshot.exists()) {
        setJoinListIdInput("")
        return
      }

      makeListIdFirst(listIdToJoin)
      setJoinListIdInput("")
      closeSettingsModal()
      vibrate()
    } catch {
      setJoinListIdInput("")
    }
  }

  function createList() {
    const newListId = String(Date.now())
    const nextListIds = [newListId, ...listIds.filter(id => id !== newListId)]
    const trimmedName = normalizeText(newListNameInput)
    const nextNames = { ...listNames }

    if (trimmedName) {
      nextNames[newListId] = trimmedName
    }

    persistAndSetLists(nextListIds, nextNames)
    setCurrentListId(newListId)
    setNewListNameInput("")
    closeSettingsModal()
    vibrate()
  }

  async function copyList() {
    if (!currentListId) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentListId)
      vibrate()
    } catch {
      window.alert("Could not copy list number. Please copy it manually.")
    }
  }

  function editListName() {
    if (!currentListId) {
      return
    }

    const trimmedName = normalizeText(currentListNameInput)
    const nextNames = { ...listNames }

    if (trimmedName) {
      nextNames[currentListId] = trimmedName
    } else {
      delete nextNames[currentListId]
    }

    persistAndSetLists(listIds, nextNames)
    closeSettingsModal()
    vibrate()
  }

  return {
    isSettingsOpen,
    currentListNameInput,
    setCurrentListNameInput,
    newListNameInput,
    setNewListNameInput,
    joinListIdInput,
    setJoinListIdInput,
    openSettingsModal,
    closeSettingsModal,
    leaveList,
    joinList,
    createList,
    copyList,
    editListName
  }
}

export type SettingsConcernState = ReturnType<typeof useSettingsConcern>
