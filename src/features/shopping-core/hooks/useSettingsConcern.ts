import { useState } from "react"
import { child, get, getDatabase, ref } from "firebase/database"
import { vibrate } from "@/shared/utils/vibrate"
import { normalizeText } from "@/shared/utils/text"
import { addListToStorage, generateListId } from "../utils/storage"
import { StoredList } from "@/shared/types/shopping"

export type SettingsConcernParams = {
  currentListId: string
  storedLists: StoredList[]
  setCurrentListId: (value: string) => void
  handleListsChange: (nextLists: StoredList[]) => void
}

export function useSettingsConcern({ currentListId, storedLists, setCurrentListId, handleListsChange }: SettingsConcernParams) {
  const [currentListNameInput, setCurrentListNameInput] = useState("")
  const [newListNameInput, setNewListNameInput] = useState("")
  const [joinListIdInput, setJoinListIdInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  function openSettingsModal() {
    setCurrentListNameInput(storedLists.find(list => list.listId === currentListId)?.listName ?? "")
    setIsOpen(true)
    // prevent scrolling while modal is open
    document.body.style.overflow = "hidden"
  }

  function leaveList() {
    if (!currentListId) {
      return
    }

    if (!window.confirm("Leave this list? You can rejoin later using its list number.")) {
      return
    }

    const remainingLists = storedLists.filter(list => list.listId !== currentListId)
    const nextLists = remainingLists.length > 0 ? remainingLists : [{ listId: generateListId(), listName: "" }]

    handleListsChange(nextLists)
    setCurrentListId(nextLists[0].listId)
    setIsOpen(false)
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

      addListToStorage(listIdToJoin)
      setJoinListIdInput("")
      setIsOpen(false)
      vibrate()
    } catch {
      setJoinListIdInput("")
    }
  }

  function createList() {
    const newListId = generateListId()
    const trimmedName = normalizeText(newListNameInput)
    const nextLists = [{ listId: newListId, listName: trimmedName }, ...storedLists]

    handleListsChange(nextLists)
    setCurrentListId(newListId)
    setNewListNameInput("")
    setIsOpen(false)
    vibrate()
  }

  async function copyList() {
    if (!currentListId) {
      return false
    }

    try {
      await navigator.clipboard.writeText(currentListId)
      vibrate()
      return true
    } catch {
      window.alert("Could not copy list number. Please copy it manually.")
      return false
    }
  }

  function editListName() {
    if (!currentListId) {
      return
    }

    const trimmedName = normalizeText(currentListNameInput)

    const nextLists = storedLists.map(list => (list.listId === currentListId ? { ...list, listName: trimmedName } : list))

    handleListsChange(nextLists)
    setIsOpen(false)
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
    isOpen,
    setIsOpen
  }
}
