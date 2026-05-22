/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react"
import { child, get, getDatabase, onValue, push, ref, remove, set } from "firebase/database"
import { database } from "../lib/firebase"
import { loadSavedLists, persistLists } from "../lib/storage"
import { normalizeText, vibrate } from "../lib/text"
import type { ShoppingItem } from "@/shared/types/shopping"

export function useShoppingList() {
  const [listIds, setListIds] = useState<string[]>([])
  const [listNames, setListNames] = useState<Record<string, string>>({})
  const [currentListId, setCurrentListId] = useState("")
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemEntry, setItemEntry] = useState("")

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentListNameInput, setCurrentListNameInput] = useState("")
  const [newListNameInput, setNewListNameInput] = useState("")
  const [joinListIdInput, setJoinListIdInput] = useState("")

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const { seededListIds, prunedListNames } = loadSavedLists()

    persistLists(seededListIds, prunedListNames)
    setListIds(seededListIds)
    setListNames(prunedListNames)
    setCurrentListId(seededListIds[0] ?? "")
  }, [])

  useEffect(() => {
    if (!currentListId) {
      return
    }

    const listRef = ref(database, currentListId)

    const unsubscribe = onValue(listRef, snapshot => {
      if (!snapshot.exists()) {
        setItems([])
        return
      }

      const nextItems = Object.entries(snapshot.val() as Record<string, { itemName: string; itemHighlighted: boolean }>).map(([id, value]) => ({
        id,
        itemName: value.itemName,
        itemHighlighted: value.itemHighlighted
      }))

      setItems(nextItems)
    })

    return () => unsubscribe()
  }, [currentListId])

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingItemId])

  function persistAndSetLists(nextListIds: string[], nextListNames: Record<string, string>) {
    persistLists(nextListIds, nextListNames)
    setListIds(nextListIds)
    setListNames(nextListNames)
  }

  function makeListIdFirst(listId: string) {
    const nextListIds = [listId, ...listIds.filter(id => id !== listId)]
    const nextNames: Record<string, string> = {}
    for (const id of nextListIds) {
      if (listNames[id]) {
        nextNames[id] = listNames[id]
      }
    }

    persistAndSetLists(nextListIds, nextNames)
    setCurrentListId(listId)
  }

  function addInputToList() {
    const inputValue = normalizeText(itemEntry)
    if (!inputValue || !currentListId) {
      setItemEntry("")
      return
    }

    push(ref(database, currentListId), {
      itemName: inputValue,
      itemHighlighted: false
    })
    vibrate()

    setItemEntry("")
  }

  function toggleHighlight(item: ShoppingItem) {
    set(ref(database, `${currentListId}/${item.id}/itemHighlighted`), !item.itemHighlighted)
    vibrate()
  }

  function deleteItem(itemId: string) {
    remove(ref(database, `${currentListId}/${itemId}`))
    vibrate()
  }

  function markAllItems(nextValue: boolean) {
    for (const item of items) {
      if (item.itemHighlighted !== nextValue) {
        set(ref(database, `${currentListId}/${item.id}/itemHighlighted`), nextValue)
      }
    }

    vibrate()
  }

  function deleteMarkedItems() {
    if (!window.confirm("Delete marked items from current list?")) {
      return
    }

    for (const item of items) {
      if (item.itemHighlighted) {
        remove(ref(database, `${currentListId}/${item.id}`))
      }
    }

    vibrate()
  }

  function deleteAllItems() {
    if (!window.confirm("Delete all items from current list?")) {
      return
    }

    for (const item of items) {
      remove(ref(database, `${currentListId}/${item.id}`))
    }

    vibrate()
  }

  function startEditItem(item: ShoppingItem) {
    setEditingItemId(item.id)
    setEditingItemText(item.itemName)
    vibrate()
  }

  function saveEditedItem() {
    if (!editingItemId) {
      return
    }

    const nextValue = normalizeText(editingItemText)
    if (nextValue) {
      set(ref(database, `${currentListId}/${editingItemId}/itemName`), nextValue)
    }

    setEditingItemId(null)
    setEditingItemText("")
  }

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

    const remainingListIds = listIds.filter(id => id !== currentListId)
    const nextListIds = remainingListIds.length > 0 ? remainingListIds : [String(Date.now())]
    const nextListNames: Record<string, string> = {}

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
    listIds,
    listNames,
    currentListId,
    items,
    itemEntry,
    setItemEntry,
    isSettingsOpen,
    currentListNameInput,
    setCurrentListNameInput,
    newListNameInput,
    setNewListNameInput,
    joinListIdInput,
    setJoinListIdInput,
    editingItemId,
    editingItemText,
    setEditingItemText,
    editInputRef,
    makeListIdFirst,
    addInputToList,
    toggleHighlight,
    deleteItem,
    markAllItems,
    deleteMarkedItems,
    deleteAllItems,
    startEditItem,
    saveEditedItem,
    openSettingsModal,
    closeSettingsModal,
    leaveList,
    joinList,
    createList,
    copyList,
    editListName
  }
}
