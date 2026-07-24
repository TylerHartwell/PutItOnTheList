import { useEffect, useRef, useState } from "react"
import { DataSnapshot, onValue, ref } from "firebase/database"
import { type User } from "firebase/auth"
import { database } from "@/shared/lib/firebase/config"
import {
  dbAddItem,
  dbChangeItemsHighlight,
  dbDeleteItems,
  dbReorderItems,
  dbSaveEditedItem,
  generateSequentialSortOrder
} from "@/shared/lib/firebase/functions"
import type { ShoppingItem } from "@/shared/types/shopping"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toShoppingItem(id: string, value: unknown, fallbackOrder: string): ShoppingItem | null {
  if (!isRecord(value)) return null

  const itemName = value.itemName
  if (typeof itemName !== "string") return null

  const sortOrder =
    typeof value.sortOrder === "string"
      ? value.sortOrder
      : typeof value.createdAt === "number"
        ? `${value.createdAt}`
        : typeof value.updatedAt === "number"
          ? `${value.updatedAt}`
          : fallbackOrder

  return {
    id,
    itemName,
    itemHighlighted: typeof value.itemHighlighted === "boolean" ? value.itemHighlighted : false,
    lastEditedByUid: typeof value.lastEditedByUid === "string" ? value.lastEditedByUid : "",
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : undefined,
    sortOrder
  }
}

function readItemsFromSnapshot(snapshot: DataSnapshot): ShoppingItem[] {
  const rawData = snapshot.val()

  if (!isRecord(rawData)) return []

  const nextItems: ShoppingItem[] = []

  for (const [id, value] of Object.entries(rawData)) {
    const parsed = toShoppingItem(id, value, nextItems.length.toString())

    if (parsed) {
      nextItems.push(parsed)
    }
  }

  return nextItems.sort((left, right) => {
    const leftOrder = left.sortOrder ?? ""
    const rightOrder = right.sortOrder ?? ""

    return leftOrder.localeCompare(rightOrder)
  })
}

export function useItemsConcern(user: User | null, currentListId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemEntry, setItemEntry] = useState("")
  const [editingItemId, setEditingItemId] = useState<string>("")
  const [editingItemText, setEditingItemText] = useState("")
  const editInputRef = useRef<HTMLInputElement | null>(null)

  const editorUid = user?.uid || ""
  const itemsPath = `lists/${currentListId}/items`

  useEffect(() => {
    if (!database || !editorUid || !currentListId) {
      return
    }

    const itemsRef = ref(database, itemsPath)

    const unsubscribeCurrent = onValue(itemsRef, snapshot => {
      const nextItems = readItemsFromSnapshot(snapshot)
      setItems(nextItems)
    })

    return () => {
      unsubscribeCurrent()
    }
  }, [currentListId, editorUid, itemsPath])

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
    await dbAddItem(itemEntry, editorUid, currentListId, nextSortOrder)
    changeItemEntry("")
  }

  async function moveItem(itemId: string, targetItemId: string) {
    if (!currentListId || !editorUid || itemId === targetItemId) {
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
      editorUid,
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
    await dbChangeItemsHighlight(!item.itemHighlighted, editorUid, currentListId, [item.id])
  }

  async function deleteItem(itemId: string) {
    await dbDeleteItems(currentListId, editorUid, [itemId])
  }

  async function markAllItems(nextValue: boolean) {
    const itemIdsToChangeMark = items.filter(item => item.itemHighlighted !== nextValue).map(item => item.id)

    await dbChangeItemsHighlight(nextValue, editorUid, currentListId, itemIdsToChangeMark)
  }

  async function deleteMarkedItems() {
    if (!window.confirm("Delete marked items from current list?")) {
      return
    }

    const markedItemIds = items.filter(item => item.itemHighlighted).map(item => item.id)

    await dbDeleteItems(currentListId, editorUid, markedItemIds)
  }

  async function deleteAllItems() {
    if (!window.confirm("Delete all items from current list?")) {
      return
    }

    const allItemIds = items.map(item => item.id)

    await dbDeleteItems(currentListId, editorUid, allItemIds)
  }

  function startEditItem(item: ShoppingItem) {
    setEditingItemId(item.id)
    setEditingItemText(item.itemName)
  }

  async function saveEditedItem() {
    await dbSaveEditedItem(currentListId, editingItemId, editingItemText, editorUid)

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
