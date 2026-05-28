import { useRef, useState } from "react"
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
  const settingsModalRef = useRef<HTMLDialogElement | null>(null)

  function openSettingsModal() {
    setCurrentListNameInput(storedLists.find(list => list.listId === currentListId)?.listName ?? "")
    settingsModalRef.current?.showModal()
  }

  function closeSettingsModal() {
    settingsModalRef.current?.close()
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

      addListToStorage(listIdToJoin)
      setJoinListIdInput("")
      closeSettingsModal()
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

    const nextLists = storedLists.map(list => (list.listId === currentListId ? { ...list, listName: trimmedName } : list))

    handleListsChange(nextLists)
    closeSettingsModal()
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
    closeSettingsModal,
    leaveList,
    joinList,
    createList,
    copyList,
    editListName,
    settingsModalRef
  }
}

export type SettingsConcernState = ReturnType<typeof useSettingsConcern>
