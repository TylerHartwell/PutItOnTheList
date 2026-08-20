import { useEffect, useRef, useState } from "react"
import {
  dbAddItem,
  dbChangeItemsHighlight,
  dbDeleteItems,
  dbReorderItems,
  dbSaveEditedItem,
  dbSubscribeToListItems
} from "@/shared/lib/firebase/items"
import { generateSequentialSortOrder } from "@/shared/lib/firebase/shared"
import type { ShoppingItem } from "@/shared/types/shopping"

export function useItemsConcern(userId: string, currentListId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemEntry, setItemEntry] = useState("")
  const [editingItemId, setEditingItemId] = useState<string>("")
  const [editingItemText, setEditingItemText] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const unsubscribeToListItems = dbSubscribeToListItems(currentListId, userId, setItems)

    return () => {
      unsubscribeToListItems?.()
    }
  }, [currentListId, userId])

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingItemId])

  function changeItemEntry(value: string) {
    setItemEntry(value)
  }

  async function addItem() {
    const nextSortOrder = generateSequentialSortOrder(items.length)
    await dbAddItem(itemEntry, userId, currentListId, nextSortOrder)
    changeItemEntry("")
  }

  async function moveItem(itemId: string, targetItemId: string) {
    if (!currentListId || !userId || itemId === targetItemId) {
      return
    }

    const previousItems = [...items]
    const nextItems = [...items]
    const sourceIndex = nextItems.findIndex(item => item.id === itemId)
    const targetIndex = nextItems.findIndex(item => item.id === targetItemId)

    if (sourceIndex < 0 || targetIndex < 0) {
      return
    }

    const [movedItem] = nextItems.splice(sourceIndex, 1)
    nextItems.splice(targetIndex, 0, movedItem)

    const reorderedItems: ShoppingItem[] = []

    for (let index = 0; index < nextItems.length; index += 1) {
      const currentItem = nextItems[index]
      const nextSortOrder = generateSequentialSortOrder(index)

      reorderedItems.push({ ...currentItem, sortOrder: nextSortOrder })
    }

    setItems(reorderedItems)

    const didPersist = await dbReorderItems(
      currentListId,
      userId,
      reorderedItems.map(item => ({
        id: item.id,
        sortOrder: item.sortOrder ?? generateSequentialSortOrder(0)
      }))
    )

    if (!didPersist) {
      setItems(previousItems)
    }
  }

  async function toggleHighlight(item: ShoppingItem) {
    await dbChangeItemsHighlight(!item.itemHighlighted, userId, currentListId, [item.id])
  }

  async function deleteItem(itemId: string) {
    await dbDeleteItems(currentListId, userId, [itemId])
  }

  async function markAllItems(nextValue: boolean) {
    const itemIdsToChangeMark = items.filter(item => item.itemHighlighted !== nextValue).map(item => item.id)

    await dbChangeItemsHighlight(nextValue, userId, currentListId, itemIdsToChangeMark)
  }

  async function deleteMarkedItems() {
    if (!window.confirm("Delete marked items from current list?")) {
      return
    }

    const markedItemIds = items.filter(item => item.itemHighlighted).map(item => item.id)

    await dbDeleteItems(currentListId, userId, markedItemIds)
  }

  async function deleteAllItems() {
    if (!window.confirm("Delete all items from current list?")) {
      return
    }

    const allItemIds = items.map(item => item.id)

    await dbDeleteItems(currentListId, userId, allItemIds)
  }

  function startEditItem(item: ShoppingItem) {
    setEditingItemId(item.id)
    setEditingItemText(item.itemName)
  }

  async function saveEditedItem() {
    await dbSaveEditedItem(currentListId, editingItemId, editingItemText, userId)

    setEditingItemId("")
    setEditingItemText("")
  }

  return {
    items,
    itemEntry,
    changeItemEntry,
    editingItemId,
    editingItemText,
    setEditingItemText,
    editInputRef,
    addItem,
    moveItem,
    toggleHighlight,
    deleteItem,
    markAllItems,
    deleteMarkedItems,
    deleteAllItems,
    startEditItem,
    saveEditedItem
  }
}
