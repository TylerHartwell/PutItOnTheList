import { useEffect, useRef, useState } from "react"
import { onValue, push, ref, remove, set } from "firebase/database"
import { database } from "../lib/firebase"
import { normalizeText, vibrate } from "../lib/text"
import type { ShoppingItem } from "@/shared/types/shopping"

export function useItemsConcern(currentListId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemEntry, setItemEntry] = useState("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)

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

  return {
    items,
    itemEntry,
    setItemEntry,
    editingItemId,
    editingItemText,
    setEditingItemText,
    editInputRef,
    addInputToList,
    toggleHighlight,
    deleteItem,
    markAllItems,
    deleteMarkedItems,
    deleteAllItems,
    startEditItem,
    saveEditedItem
  }
}

export type ItemsConcernState = ReturnType<typeof useItemsConcern>
