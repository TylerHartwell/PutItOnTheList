import { useEffect, useRef, useState } from "react"
import { DataSnapshot, onValue, push, ref, remove, set, update } from "firebase/database"
import { type User } from "firebase/auth"
import { database } from "@/shared/lib/firebase"
import type { ShoppingItem } from "@/shared/types/shopping"
import { trimAndCollapseSpaces } from "@/shared/utils/text"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function toShoppingItem(id: string, value: unknown): ShoppingItem | null {
  if (!isRecord(value)) return null

  const itemName = value.itemName
  if (typeof itemName !== "string") return null

  return {
    id,
    itemName,
    itemHighlighted: typeof value.itemHighlighted === "boolean" ? value.itemHighlighted : false,
    lastEditedByUid: typeof value.lastEditedByUid === "string" ? value.lastEditedByUid : ""
  }
}

function readItemsFromSnapshot(snapshot: DataSnapshot): ShoppingItem[] {
  const rawData = snapshot.val()

  if (!isRecord(rawData)) return []

  const nextItems: ShoppingItem[] = []

  for (const [id, value] of Object.entries(rawData)) {
    const parsed = toShoppingItem(id, value)

    if (parsed) {
      nextItems.push(parsed)
    }
  }

  return nextItems
}

export function useItemsConcern(user: User | null, currentListId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [itemEntry, setItemEntry] = useState("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
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

  function addItem() {
    const itemName = trimAndCollapseSpaces(itemEntry)

    if (!database || !itemName || !editorUid || !currentListId) {
      changeItemEntry("")
      return
    }

    push(ref(database, itemsPath), {
      itemName: itemName,
      itemHighlighted: false,
      lastEditedByUid: editorUid
    })
    set(ref(database, `lists/${currentListId}/lastEditedByUid`), editorUid)
    changeItemEntry("")
  }

  function toggleHighlight(item: ShoppingItem) {
    if (!database || !editorUid || !currentListId) {
      return
    }

    void update(ref(database, `${itemsPath}/${item.id}`), {
      itemHighlighted: !item.itemHighlighted,
      lastEditedByUid: editorUid
    })
    set(ref(database, `lists/${currentListId}/lastEditedByUid`), editorUid)
  }

  function deleteItem(itemId: string) {
    if (!database || !editorUid || !currentListId) {
      return
    }

    remove(ref(database, `${itemsPath}/${itemId}`))
    set(ref(database, `lists/${currentListId}/lastEditedByUid`), editorUid)
  }

  function markAllItems(nextValue: boolean) {
    if (!database || !editorUid || !currentListId) {
      return
    }

    const batchUpdates: Record<string, unknown> = {
      [`lists/${currentListId}/lastEditedByUid`]: editorUid
    }

    for (const item of items) {
      if (item.itemHighlighted !== nextValue) {
        batchUpdates[`${itemsPath}/${item.id}/itemHighlighted`] = nextValue
        batchUpdates[`${itemsPath}/${item.id}/lastEditedByUid`] = editorUid
      }
    }

    void update(ref(database), batchUpdates)
  }

  function deleteMarkedItems() {
    if (!database || !editorUid || !currentListId) {
      return
    }

    if (!window.confirm("Delete marked items from current list?")) {
      return
    }

    const batchUpdates: Record<string, unknown> = {
      [`lists/${currentListId}/lastEditedByUid`]: editorUid
    }

    for (const item of items) {
      if (item.itemHighlighted) {
        batchUpdates[`${itemsPath}/${item.id}`] = null
      }
    }

    void update(ref(database), batchUpdates)
  }

  function deleteAllItems() {
    if (!database || !editorUid || !currentListId) {
      return
    }

    if (!window.confirm("Delete all items from current list?")) {
      return
    }

    void update(ref(database), {
      [itemsPath]: null,
      [`lists/${currentListId}/lastEditedByUid`]: editorUid
    })
  }

  function startEditItem(item: ShoppingItem) {
    setEditingItemId(item.id)
    setEditingItemText(item.itemName)
  }

  function saveEditedItem() {
    if (!database || !editingItemId || !editorUid || !currentListId) {
      setEditingItemId(null)
      setEditingItemText("")
      return
    }

    const trimmedName = trimAndCollapseSpaces(editingItemText)

    if (!trimmedName) {
      remove(ref(database, `${itemsPath}/${editingItemId}`))
    } else {
      void update(ref(database, `${itemsPath}/${editingItemId}`), {
        itemName: trimmedName,
        lastEditedByUid: editorUid
      })
    }

    set(ref(database, `lists/${currentListId}/lastEditedByUid`), editorUid)

    setEditingItemId(null)
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
    toggleHighlight,
    deleteItem,
    markAllItems,
    deleteMarkedItems,
    deleteAllItems,
    startEditItem,
    saveEditedItem
  }
}
